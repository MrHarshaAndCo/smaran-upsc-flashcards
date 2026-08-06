import { peerFeedback } from '../engine/feedback.js';
import { h2hRecord } from '../engine/nemesis.js';
import { missToast } from '../engine/nemesisToast.js';
import { shouldUseAi } from '../engine/aiCoach.js';

/**
 * Deliberate quiz session state (select → check → next) for the
 * per-quiz flow at /quiz/[quizId].
 */
export class QuizSession {
	questions = $state([]);
	quiz = $state(null);
	idx = $state(0);
	selected = $state(null);
	answered = $state(false);
	feedback = $state(null);
	results = $state([]);
	/** @type {Map<string, number>} questionId → miss count */
	misses = $state(new Map());
	done = $state(false);
	posting = $state(false);
	summary = $state(null);

	peerStats = {};
	nemesisStats = null;
	nemesisName = null;
	userName = 'Aspirant';

	startedAt = Date.now();
	cardShownAt = Date.now();

	constructor({ quiz, peerStats, nemesisStats, nemesisName, userName }) {
		this.quiz = quiz;
		this.questions = quiz.questions;
		this.peerStats = peerStats;
		this.nemesisStats = nemesisStats;
		this.nemesisName = nemesisName;
		if (nemesisUserId) this.nemesisUserId = nemesisUserId;
		if (userName) this.userName = userName;
	}

	get current() {
		return this.questions[this.idx];
	}

	choose(i) {
		if (this.answered) return;
		this.selected = i;
	}

	check() {
		if (this.selected === null || this.answered) return;
		const q = this.current;
		const correct = this.selected === q.correctIndex;
		this.results.push({ questionId: q.id, chosen: this.selected, correct, ms: Date.now() - this.cardShownAt });

		const items = [];
		if (!correct) {
			const count = (this.misses.get(q.id) ?? 0) + 1;
			this.misses.set(q.id, count);
			const nemesisRate = (() => {
				const s = this.nemesisStats?.[q.id];
				return s && s.totalCount > 0 ? s.correctCount / s.totalCount : null;
			})();
			const miss = missToast({
				missCount: count,
				nemesisRate,
				nemesisName: this.nemesisName ?? 'your rival',
				correctText: q.options[q.correctIndex]
			});
			items.push({ tone: miss.tone === 'error' ? 'bad' : 'neutral', title: miss.title, body: miss.body });
		} else {
			items.push({ tone: 'good', title: 'Correct', body: q.explanation });
		}
		const peer = peerFeedback({
			correct,
			peers: this.peerStats?.[q.id] ?? null,
			nemesis: this.nemesisStats?.[q.id] ?? null
		});
		if (peer) items.push(peer);
		this.feedback = items;
		this.answered = true;
		this.cardShownAt = Date.now();
	}

	next() {
		if (this.idx + 1 < this.questions.length) {
			this.idx++;
			this.selected = null;
			this.answered = false;
			this.feedback = null;
			this.cardShownAt = Date.now();
		} else {
			this.finish();
		}
	}

	async finish() {
		this.done = true;
		const correct = this.results.filter((r) => r.correct).length;
		const total = this.results.length;

		let rivalNote = null;
		if (this.nemesisStats && this.nemesisName) {
			let nc = 0;
			let nt = 0;
			for (const s of Object.values(this.nemesisStats)) {
				nc += s.correctCount;
				nt += s.totalCount;
			}
			const r = h2hRecord({ myCorrect: correct, myTotal: total, theirCorrect: nc, theirTotal: nt });
			rivalNote =
				r.outcome === 'win'
					? `You beat ${this.nemesisName} on this quiz — ${Math.round(r.myRate * 100)}% vs their ${Math.round(r.theirRate * 100)}%.`
					: r.outcome === 'loss'
						? `${this.nemesisName} scored better on this quiz — their ${Math.round(r.theirRate * 100)}% beats your ${Math.round(r.myRate * 100)}%. Rematch.`
						: `Dead even with ${this.nemesisName} on this quiz. The next one decides.`;
		}

		const rate = total === 0 ? 0 : correct / total;
		const advice =
			rate >= 0.9
				? { tone: 'good', title: 'Examination form', body: `${Math.round(rate * 100)}% — a serious score. The misses below are all that matter now.` }
				: rate >= 0.6
					? { tone: 'neutral', title: 'Solid, with seams', body: `${Math.round(rate * 100)}% correct. Review the missed questions below — they are your real syllabus.` }
					: { tone: 'bad', title: 'Rough pass', body: `${Math.round(rate * 100)}% — below your standard. Go through every miss, then retake tomorrow.` };

		this.summary = { correct, total, advice, rivalNote };

			// Nemesis encounter data.
			let nemesisPayload = undefined;
			if (this.nemesisUserId) {
				let nc = 0, nt = 0;
				if (this.nemesisStats) for (const s of Object.values(this.nemesisStats)) { nc += s.correctCount; nt += s.totalCount; }
				if (nt > 0 && total > 0) {
					nemesisPayload = { nemesisUserId: this.nemesisUserId, myCorrect: correct, myTotal: total, theirCorrect: nc, theirTotal: nt, outcome: (correct / total) > (nc / nt) ? "win" : (correct / total) < (nc / nt) ? "loss" : "draw" };
				}
			}
		this.posting = true;
		try {
			await fetch('/api/quiz', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					quizId: this.quiz.id,
					startedAt: this.startedAt,
					endedAt: Date.now(),
					results: this.results.map((r) => ({ questionId: r.questionId, correct: r.correct, ms: r.ms })),
					nemesis: nemesisPayload,
				})
			});
		} catch {
			// Best-effort
		}

		// AI coach for a rough pass.
		if (shouldUseAi(correct, total)) {
			try {
				const r = await fetch('/api/ai-feedback', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						score: correct,
						total,
						name: this.userName,
						items: this.results.map((res) => {
							const q = this.questions.find((qq) => qq.id === res.questionId);
							return { question: q?.question ?? '', correct: res.correct };
						})
					})
				});
				const j = await r.json();
				if (j.ai) this.summary.aiCoach = j.message;
			} catch {
				// Coach is optional
			}
		}
		this.posting = false;
	}

	restart() {
		this.idx = 0;
		this.selected = null;
		this.answered = false;
		this.feedback = null;
		this.results = [];
		this.done = false;
		this.summary = null;
		this.cardShownAt = Date.now();
	}

	optionVariant(i) {
		if (!this.answered) return this.selected === i ? 'secondary' : 'outline';
		if (i === this.current.correctIndex) return 'success';
		if (i === this.selected) return 'destructive';
		return 'outline';
	}
}
