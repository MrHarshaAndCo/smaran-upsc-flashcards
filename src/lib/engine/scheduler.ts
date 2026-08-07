/**
 * Spaced-repetition scheduler (SM-2 flavoured).
 * Pure and deterministic: given a rating and a card's learning state it
 * returns the next state. No I/O, no randomness.
 *
 * @typedef {'again'|'hard'|'good'|'easy'} Rating
 * @typedef {{ ease: number, intervalDays: number, reps: number, lapses: number, due: number }} CardState
 */

export const DAY_MS = 86_400_000;
export const MIN_EASE = 1.3;
export const BASE_EASE = 2.5;
export const RATINGS = /** @type {const} */ (['again', 'hard', 'good', 'easy']);

/** SM-2 quality mapping for the four buttons. */
const RATING_Q = { again: 0, hard: 1, good: 3, easy: 5 };

/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * @param {number} [now]
 * @returns {CardState}
 */
export function initialCardState(now = Date.now()) {
	return { ease: BASE_EASE, intervalDays: 0, reps: 0, lapses: 0, due: now };
}

/**
 * Apply a rating to a card state and return the new state.
 * - again   → lapse, back to learning (due in 10 minutes)
 * - hard    → smallest growth, 1.2x interval
 * - good    → SM-2 interval * ease
 * - easy    → 4 days on first sight, then interval * ease * 1.3
 *
 * @param {Rating} rating
 * @param {CardState} state
 * @returns {CardState}
 */
export function applyRating(rating, state) {
	const q = RATING_Q[rating];

	// SM-2 ease factor update.
	let ease = state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
	if (ease < MIN_EASE) ease = MIN_EASE;

	const lapses = rating === 'again' ? state.lapses + 1 : state.lapses;

	let reps;
	let intervalDays;
	let due;

	if (rating === 'again') {
		reps = 0;
		intervalDays = 0;
		due = Date.now() + 10 * 60_000;
	} else if (state.reps === 0) {
		reps = 1;
		intervalDays = rating === 'easy' ? 4 : 1;
		due = Date.now() + intervalDays * DAY_MS;
	} else {
		reps = state.reps + 1;
		const prev = Math.max(state.intervalDays, 1);
		const factor = rating === 'hard' ? 1.2 : rating === 'easy' ? ease * 1.3 : ease;
		intervalDays = Math.max(1, Math.round(prev * factor));
		due = Date.now() + intervalDays * DAY_MS;
	}

	return { ease: round2(ease), intervalDays, reps, lapses, due };
}

/**
 * Whether a state still sits in the "learning" phase (interval < 1 day).
 * @param {CardState} state
 */
export function isLearning(state) {
	return state.intervalDays < 1;
}
