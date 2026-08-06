import { applyRating, initialCardState, DAY_MS } from '../engine/scheduler.js';
import { memoryFeedback, peerFeedback, sessionAdvice } from '../engine/feedback.js';
import { h2hRecord } from '../engine/nemesis.js';
import { missToast } from '../engine/nemesisToast.js';
import { shouldUseAi } from '../engine/aiCoach.js';
import { seededShuffle } from '../engine/shuffle.js';

/**
 * Study session state — rune-based, lives in .svelte.ts so `$state` is real.
 * All flashcard review logic (queue, ratings, feedback, save) lives here;
 * the page is a thin renderer.
 */
export class StudySession {
	/** @type {import('../data/store.js').Card[]} */
	cards = $state([]);
	deckId = $state('');
	deck = $state(null);
	queue = $state([]);
	idx = $state(0);
	flipped = $state(false);
	rated = $state(false);
	/** @type {any[]} */
	feedbacks = $state([]);
	/** @type {Array<{ cardId: string, rating: string, ms: number }>} */
	results = $state([]);
	/** @type {Map<string, number>} cardId → miss count */
	misses = $state(new Map());
	requeue = $state([]);
	repass = $state(false);
	done = $state(false);
	posting = $state(false);
	/** @type {Map<string, any>} */
	states = $state(new Map());
	summary = $state(null);

	// Server-provided context.
	peerStats = {};
	nemesisStats = null;
	nemesisName = null;
	myMeta = {};
	userName = 'Aspirant';

	startedAt = Date.now();
	cardShownAt = Date.now();

	constructor({ deck, cards, cardStates, peerStats, nemesisStats, nemesisName, myMeta, userName, nemesisUserId }) {
		this.deck = deck;
		this.deckId = deck.id;
		this.cards = cards;
		this.peerStats = peerStats;
		this.nemesisStats = nemesisStats;
		this.nemesisName = nemesisName;
		if (nemesisUserId) this.nemesisUserId = nemesisUserId;
		this.myMeta = myMeta;
		if (userName) this.userName = userName;
		this.states = new Map(Object.entries(cardStates).map(([k, v]) => [k, { ...v }]));
		// Due cards first, then never-seen cards, then the rest — spaced
		// repetition should surface the cards the scheduler wants back.
		const now = Date.now();
		const due = [];
		const fresh = [];
		const rest = [];
		for (const card of cards) {
			const st = this.states.get(card.id);
			if (st && st.due <= now) due.push(card);
			else if (!st) fresh.push(card);
			else rest.push(card);
		}
		const seed = `${deck.id}:0`;
		this.queue = [
			...seededShuffle(due, seed),
			...seededShuffle(fresh, `${seed}:new`),
			...seededShuffle(rest, `${seed}:rest`)
		];
	}

	get current() {
		return this.queue[this.idx];
	}

	get answered() {
		return this.results.length;
	}

	get totalInPass() {
		return this.queue.length;
	}

	rate(rating) {
		if (!this.current || this.rated) return;
		const card = this.current;
		const ms = Date.now() - this.cardShownAt;
		const prev = this.states.get(card.id) ?? initialCardState();
		const nextState = applyRating(rating, prev);
		this.states.set(card.id, nextState);
		this.results.push({ cardId: card.id, rating, ms });
		const correct = rating !== 'again';
		if (!correct) this.requeue.push(card.id);

		const meta = this.myMeta?.[card.id] ?? { reviewCount: 0, lastAt: 0 };
		const gapDays = meta.lastAt ? Math.max(0, Math.round((Date.now() - meta.lastAt) / DAY_MS)) : 0;
		const items = [];
		if (!correct) {
			const count = (this.misses.get(card.id) ?? 0) + 1;
			this.misses.set(card.id, count);
			const nemesisRate = (() => {
				const s = this.nemesisStats?.[card.id];
				return s && s.totalCount > 0 ? s.correctCount / s.totalCount : null;
			})();
			const miss = missToast({
				missCount: count,
				nemesisRate,
				nemesisName: this.nemesisName ?? 'your rival',
				correctText: card.back
			});
			items.push({ tone: miss.tone === 'error' ? 'bad' : 'neutral', title: miss.title, body: miss.body });
		} else {
			items.push(
				memoryFeedback({
					rating,
					correct,
					state: nextState,
					prevState: meta.lastAt ? prev : null,
					gapDays,
					reviewCount: meta.reviewCount + 1
				})
			);
		}
		const peer = peerFeedback({
			correct,
			peers: this.peerStats?.[card.id] ?? null,
			nemesis: this.nemesisStats?.[card.id] ?? null
		});
		if (peer) items.push(peer);
		this.feedbacks = items;
		this.rated = true;
		this.cardShownAt = Date.now();
	}

	next() {
		if (this.idx + 1 < this.queue.length) {
			this.idx++;
			this.flipped = false;
			this.rated = false;
			this.feedbacks = [];
			this.cardShownAt = Date.now();
		} else if (this.requeue.length > 0) {
			this.queue = this.requeue;
			this.requeue = [];
			this.idx = 0;
			this.repass = true;
			this.flipped = false;
			this.rated = false;
			this.feedbacks = [];
			this.cardShownAt = Date.now();
		} else {
			this.finish();
		}
	}

	async finish() {
		this.done = true;
		const endedAt = Date.now();
		const total = this.results.length;
		const correct = this.results.filter((r) => r.rating !== 'again').length;
		const lapses = this.results.filter((r) => r.rating === 'again').length;
		const missedCards = new Set(this.results.filter((r) => r.rating === 'again').map((r) => r.cardId)).size;
		let dueTomorrow = 0;
		for (const st of this.states.values()) if (st.due <= Date.now() + DAY_MS) dueTomorrow++;
		const advice = sessionAdvice({ correct, total, lapses, missedCards, dueTomorrow });

		let nemesisNote = null;
		if (this.nemesisStats && this.nemesisName) {
			let nc = 0;
			let nt = 0;
			for (const s of Object.values(this.nemesisStats)) {
				nc += s.correctCount;
				nt += s.totalCount;
			}
			const r = h2hRecord({ myCorrect: correct, myTotal: total, theirCorrect: nc, theirTotal: nt });
			nemesisNote =
				r.outcome === 'win'
					? `You beat ${this.nemesisName} this session — ${Math.round(r.myRate * 100)}% vs their ${Math.round(r.theirRate * 100)}%.`
					: r.outcome === 'loss'
						? `${this.nemesisName} still owns this deck — their ${Math.round(r.theirRate * 100)}% beats your ${Math.round(r.myRate * 100)}%. Next pass fixes that.`
						: `Dead even with ${this.nemesisName} this time. The next session decides.`;
		}

		this.summary = { total, correct, lapses, missedCards, advice, nemesisNote };

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
			await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					deckId: this.deckId,
					startedAt: this.startedAt,
					endedAt,
					results: this.results,
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
							const card = this.cards.find((c) => c.id === res.cardId);
							return { question: card?.front ?? '', correct: res.rating !== 'again' };
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
		this.queue = seededShuffle(this.cards, `${this.deckId}:${Date.now()}`);
		this.idx = 0;
		this.flipped = false;
		this.rated = false;
		this.feedbacks = [];
		this.results = [];
		this.requeue = [];
		this.repass = false;
		this.done = false;
		this.summary = null;
		this.states = new Map();
		this.cardShownAt = Date.now();
	}
}
