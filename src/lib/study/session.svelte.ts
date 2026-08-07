import { applyRating, initialCardState, DAY_MS } from '../engine/scheduler.js';
import { memoryFeedback, peerFeedback, sessionAdvice } from '../engine/feedback.js';
import { h2hRecord } from '../engine/nemesis.js';
import { missToast, rivalReport } from '../engine/nemesisToast.js';
import { seededShuffle } from '../engine/shuffle.js';

/**
 * Study session state — rune-based, lives in .svelte.ts so `$state` is real.
 * All flashcard review logic (queue, ratings, feedback, save) lives here;
 * the page is a thin renderer.
 */
export class StudySession {
	cards = $state<any[]>([]);
	deckId = $state<string>('');
	deck = $state<any>(null);
	queue = $state<any[]>([]);
	idx = $state<number>(0);
	flipped = $state<boolean>(false);
	rated = $state<boolean>(false);
	feedbacks = $state<any[]>([]);
	results = $state<Array<{ cardId: string; rating: string; ms: number }>>([]);
	misses = $state<Map<string, number>>(new Map());
	requeue = $state<string[]>([]);
	repass = $state<boolean>(false);
	repassLevel = 0;
	done = $state<boolean>(false);
	posting = $state<boolean>(false);
	states = $state<Map<string, any>>(new Map());
	summary = $state<any>(null);
	nemesisUserId = $state<string | null>(null);

	// Server-provided context.
	peerStats: any = {};
	nemesisStats: any = null;
	nemesisName: string | null = null;
	myMeta: any = {};
	userName: string = 'Aspirant';

	startedAt = Date.now();
	cardShownAt = Date.now();

	constructor({ deck, cards, cardStates, peerStats, nemesisStats, nemesisName, myMeta, userName, nemesisUserId }: any) {
		this.deck = deck;
		this.deckId = deck.id;
		this.cards = cards;
		this.peerStats = peerStats;
		this.nemesisStats = nemesisStats;
		this.nemesisName = nemesisName;
		if (nemesisUserId) this.nemesisUserId = nemesisUserId;
		this.myMeta = myMeta;
		if (userName) this.userName = userName;
		this.states = new Map(Object.entries(cardStates || {}).map(([k, v]) => [k, { ...(v as any) }]));
		const now = Date.now();
		const due = [];
		const fresh = [];
		const rest = [];
		for (const card of cards || []) {
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

	get current(): any {
		return this.queue[this.idx];
	}

	get answered(): number {
		return this.results.length;
	}

	get totalInPass(): number {
		return this.queue.length;
	}

	rate(rating: string) {
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
		} else if (this.requeue.length > 0 && this.repassLevel < 3) {
			this.queue = this.requeue;
			this.requeue = [];
			this.idx = 0;
			this.repass = true;
			this.repassLevel++;
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

		let nemesisNote: any = null;
		if (this.nemesisStats && this.nemesisName) {
			let nc = 0;
			let nt = 0;
			for (const s of Object.values(this.nemesisStats) as any[]) {
				nc += s.correctCount;
				nt += s.totalCount;
			}
			nemesisNote = rivalReport(this.nemesisName, Math.round((correct / Math.max(total, 1)) * 100), Math.round((nc / Math.max(nt, 1)) * 100));
		}

		this.summary = { total, correct, lapses, missedCards, advice, nemesisNote };

		let nemesisPayload: any = undefined;
		if (this.nemesisUserId) {
			let nc = 0, nt = 0;
			if (this.nemesisStats) for (const s of Object.values(this.nemesisStats) as any[]) { nc += s.correctCount; nt += s.totalCount; }
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
		this.repassLevel = 0;
		this.done = false;
		this.summary = null;
		this.states = new Map();
		this.cardShownAt = Date.now();
	}
}
