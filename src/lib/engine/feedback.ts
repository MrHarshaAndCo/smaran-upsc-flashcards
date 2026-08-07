/**
 * Feedback generation after every card rating: memory advice about the user's
 * own spaced-repetition state, plus social comparison against peers and the
 * user's nemesis ("your friend got it wrong — you got it right").
 * Pure and deterministic: everything is derived from passed-in stats.
 *
 * @typedef {'again'|'hard'|'good'|'easy'} Rating
 * @typedef {{ ease: number, intervalDays: number, reps: number, lapses: number, due: number }} CardState
 * @typedef {{ correctCount: number, totalCount: number }} CorrectStats
 */

/**
 * Memory-based feedback for a single rating.
 *
 * @param {object} args
 * @param {Rating} args.rating
 * @param {boolean} args.correct       rating !== 'again'
 * @param {CardState} args.state       state AFTER this rating
 * @param {CardState|null} args.prevState  state before this rating (null on first sight)
 * @param {number} args.gapDays        days since this card was last seen
 * @param {number} args.reviewCount    total times this card has been rated
 * @returns {{ tone: 'good'|'bad'|'neutral', title: string, body: string }}
 */
export function memoryFeedback({ rating, correct, state, prevState, gapDays, reviewCount }) {
	if (!correct) {
		if (gapDays > 2) {
			return {
				tone: 'bad',
				title: 'The gap did it',
				body: `You went ${gapDays} days without seeing this card — that is where memory leaks. Keep reviews within 2 days and this sticks.`
			};
		}
		if (prevState && prevState.reps >= 2) {
			return {
				tone: 'bad',
				title: 'You knew this one',
				body: `You had answered this correctly before (${prevState.reps} times) and still slipped. Shorter gaps between reviews would have caught it.`
			};
		}
		if (state.lapses >= 2) {
			return {
				tone: 'bad',
				title: 'Keeps slipping',
				body: `${state.lapses} lapses on this card. Read the answer aloud once, then test yourself again in 10 minutes.`
			};
		}
		return {
			tone: 'neutral',
			title: 'First miss',
			body: 'Expected on a fresh card. Review it again tomorrow and it will start to anchor.'
		};
	}

	if (prevState && prevState.lapses > 0 && state.lapses === prevState.lapses) {
		return {
			tone: 'good',
			title: 'Fixed it',
			body: 'You missed this card before and just nailed it. That correction is exactly how memory is built.'
		};
	}
	if (state.reps >= 3 && state.lapses === 0) {
		return {
			tone: 'good',
			title: 'Locked in',
			body: `${state.reps} correct in a row, zero lapses. This card is nearly permanent — next review in ${state.intervalDays} day${state.intervalDays === 1 ? '' : 's'}.`
		};
	}
	return {
		tone: 'neutral',
		title: reviewCount <= 1 ? 'Good start' : 'Solid',
		body:
			reviewCount <= 1
				? 'First correct answer — the repetition clock is running.'
				: `Correct. Next review scheduled in ${state.intervalDays} day${state.intervalDays === 1 ? '' : 's'}, when memory actually needs it.`
	};
}

/**
 * Social comparison feedback for a single card, versus all peers and the nemesis.
 *
 * @param {object} args
 * @param {boolean} args.correct
 * @param {CorrectStats|null} args.peers
 * @param {CorrectStats|null} args.nemesis
 * @returns {{ tone: 'good'|'bad'|'neutral', flag: 'peer-beat'|'peer-lost'|'nemesis-beat'|'nemesis-lost'|'even', title: string, body: string } | null}
 */
export function peerFeedback({ correct, peers, nemesis }) {
	if (!peers || peers.totalCount === 0) return null;
	const peerRate = peers.correctCount / peers.totalCount;
	const nRate = nemesis && nemesis.totalCount > 0 ? nemesis.correctCount / nemesis.totalCount : null;

	if (correct && peerRate <= 0.5) {
		return {
			tone: 'good',
			flag: 'peer-beat',
			title: 'You beat the room',
			body: `Only ${Math.round(peerRate * 100)}% of peers got this right. You did. That is not luck, that is the spaced review working.`
		};
	}
	if (!correct && peerRate >= 0.6) {
		return {
			tone: 'bad',
			flag: 'peer-lost',
			title: 'The room beat you',
			body: `${Math.round(peerRate * 100)}% of peers answered this correctly. You missed it — worth a slower read of the answer.`
		};
	}
	if (nRate !== null) {
		if (correct && nRate <= 0.5) {
			return {
				tone: 'good',
				flag: 'nemesis-beat',
				title: 'Nemesis missed it',
				body: 'Your nemesis got this card wrong. You got it right. File this under tonight\u2019s scoreboard.'
			};
		}
		if (!correct && nRate > 0.5) {
			return {
				tone: 'bad',
				flag: 'nemesis-lost',
				title: 'Nemesis knows this one',
				body: 'Your nemesis answers this card correctly more often than not. They know. Now you do too.'
			};
		}
		if (correct && nRate >= 0.99 && nRate !== null && peers.totalCount > 1) {
			return {
				tone: 'neutral',
				flag: 'even',
				title: 'Dead even',
				body: 'Both you and your nemesis got this right. No edge gained, no ground lost.'
			};
		}
		if (!correct && nRate !== null && nRate <= 0.5) {
			return {
				tone: 'neutral',
				flag: 'even',
				title: 'Both fumbled',
				body: 'You and your nemesis both missed this one. Even the rivalry agrees it is hard.'
			};
		}
	}
	return null;
}

/**
 * Session-end summary advice: what to do next based on how the session went.
 *
 * @param {object} args
 * @param {number} args.correct
 * @param {number} args.total
 * @param {number} args.lapses         times 'again' pressed in this session
 * @param {number} args.missedCards    distinct cards missed
 * @param {number} args.dueTomorrow    cards scheduled due within 24h
 * @returns {{ tone: 'good'|'bad'|'neutral', title: string, body: string }}
 */
export function sessionAdvice({ correct, total, lapses, missedCards, dueTomorrow }) {
	const rate = total === 0 ? 0 : correct / total;
	if (rate >= 0.9) {
		return {
			tone: 'good',
			title: 'Examination form',
			body: `${Math.round(rate * 100)}% correct. ${missedCards > 0 ? `${missedCards} card${missedCards === 1 ? '' : 's'} slipped — the gap is small and fixable. ` : ''}Tomorrow ${dueTomorrow} card${dueTomorrow === 1 ? '' : 's'} are due; a 5-minute pass keeps this momentum.`
		};
	}
	if (rate >= 0.6) {
		return {
			tone: 'neutral',
			title: 'Solid, with seams',
			body: `${Math.round(rate * 100)}% correct, ${lapses} lapse${lapses === 1 ? '' : 's'}. The missed cards are your real syllabus — they are due again in 10 minutes to 1 day. Take the re-test pass and close the seams.`
		};
	}
	return {
		tone: 'bad',
		title: 'Rough pass',
		body: `${Math.round(rate * 100)}% this session — below your standard. That is information, not failure: these cards need daily hits until they stop slipping. Re-test the ${missedCards} missed cards now, then again tomorrow.`
	};
}
