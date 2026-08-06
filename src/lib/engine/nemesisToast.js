/**
 * Nemesis-aware toast engine — all local, no API calls.
 * Every message is a function of actual duel data: scores, history, record, streaks.
 *
 * @typedef {{ tone: 'success'|'error'|'warning'|'neutral', title: string, body: string }} ToastData
 */

/**
 * Escalating feedback for a repeated miss on the same card/question.
 * @param {{ missCount: number, nemesisRate: number|null, nemesisName: string, correctText: string|null }} args
 * @returns {ToastData}
 */
export function missToast({ missCount, nemesisRate, nemesisName, correctText }) {
	if (missCount >= 3) {
		const nemLine =
			nemesisRate == null || nemesisRate <= 0
				? `${nemesisName} hasn't even seen this one.`
				: `${nemesisName} gets this right ${Math.round(nemesisRate * 100)}% of the time.`;
		return {
			tone: 'error',
			title: 'Persistent blind spot',
			body: `You've missed this ${missCount} times now. ${nemLine} Burn it into memory — flashcards are designed for exactly this.`
		};
	}
	if (missCount === 2) {
		const nemLine =
			nemesisRate == null
				? ''
				: ` ${nemesisName} nails this ${Math.round(nemesisRate * 100)}% of the time, by the way.`;
		return {
			tone: 'warning',
			title: 'Second miss',
			body: `You missed this one twice now.${nemLine} Repetition is the point — let it sink in.`
		};
	}
	const correct = correctText ? ` · Answer: ${correctText}` : '';
	const nemLine =
		nemesisRate != null && nemesisRate > 0
			? ` ${nemesisName} gets this right ${Math.round(nemesisRate * 100)}% of the time.`
			: '';
	return {
		tone: 'warning',
		title: 'Missed it',
		body: `${nemesisName} won't let this slide.${nemLine}${correct}`
	};
}

/**
 * Session-end nemesis verdict — no API, just data.
 * @param {{
 *   userName: string, nemesisName: string,
 *   myScore: number, myTotal: number,
 *   theirScore: number, theirTotal: number,
 *   record: { wins: number, losses: number, draws: number, total: number }|null
 * }} args
 * @returns {ToastData}
 */
export function nemesisVerdict({ userName, nemesisName, myScore, myTotal, theirScore, theirTotal, record }) {
	const myRate = myTotal === 0 ? 0 : myScore / myTotal;
	const theirRate = theirTotal === 0 ? 0 : theirScore / theirTotal;
	const gap = Math.abs(myRate - theirRate);
	const outcome = myRate > theirRate ? 'win' : myRate < theirRate ? 'loss' : 'draw';

	// Build a one-line record snippet if we have history.
	const recLine = record && record.total > 0
		? ` (${record.wins}–${record.losses}–${record.draws})`
		: '';

	// --- Appreciation patterns (win) ---
	if (outcome === 'win') {
		if (myRate >= 0.95) {
			return { tone: 'success', title: 'Uncatchable', body: `${Math.round(myRate * 100)}% — almost perfect. ${nemesisName}${recLine} can't touch this round.` };
		}
		if (myRate >= 0.8 && gap >= 0.3) {
			return { tone: 'success', title: 'Dominant', body: `A ${Math.round(gap * 100)}pp gap over ${nemesisName}${recLine}. You're in a different league right now.` };
		}
		if (record && record.wins >= 3 && record.wins > record.losses * 2) {
			return { tone: 'success', title: 'Winning streak', body: `${nemesisName}${recLine} can't find a foothold — ${myRate >= 0.7 ? 'and you keep getting sharper' : 'momentum is yours'}.` };
		}
		if (record && record.total >= 3 && record.wins === record.total) {
			return { tone: 'success', title: 'Clean sweep', body: `Undefeated against ${nemesisName}${recLine}. Every single round in your name.` };
		}
		if (gap < 0.1) {
			return { tone: 'success', title: 'By a whisker', body: `You edged past ${nemesisName}${recLine} by a breath — ${Math.round(myRate * 100)}% to ${Math.round(theirRate * 100)}%. Every point counted.` };
		}
		return { tone: 'success', title: 'Victory', body: `${nemesisName}${recLine} had no answer to ${Math.round(myRate * 100)}%. The ledger tilts your way.` };
	}

	// --- Defeat / rivalry patterns (loss) ---
	if (outcome === 'loss') {
		if (record && record.total >= 3 && record.losses === record.total) {
			return { tone: 'warning', title: 'Still searching', body: `Not yet — ${nemesisName}${recLine} owns every round. Keep studying; a breakthrough is waiting.` };
		}
		if (theirRate >= 0.9 && myRate < 0.6) {
			return { tone: 'warning', title: 'Outclassed', body: `${nemesisName}${recLine} hit ${Math.round(theirRate * 100)}% while you landed at ${Math.round(myRate * 100)}%. This session is fuel — go again.` };
		}
		if (gap < 0.08) {
			return { tone: 'warning', title: 'So close', body: `${Math.round(gap * 100)}pp from ${nemesisName}${recLine}. ${Math.round(myRate * 100)}% vs ${Math.round(theirRate * 100)}% — next round is yours.` };
		}
		if (record && record.wins > 0) {
			return { tone: 'warning', title: 'Rival strikes back', body: `${nemesisName}${recLine} evened the score. The rematch is already waiting.` };
		}
		return { tone: 'warning', title: 'Nemesis lead', body: `${nemesisName}${recLine} takes this one — ${Math.round(theirRate * 100)}% to your ${Math.round(myRate * 100)}%. You know what to do next.` };
	}

	// --- Draw ---
	if (gap === 0 && myRate >= 0.8) {
		return { tone: 'neutral', title: 'Photo finish', body: `${Math.round(myRate * 100)}% each against ${nemesisName}${recLine}. Someone has to blink — and it won't be you.` };
	}
	return { tone: 'neutral', title: 'Dead even', body: `${nemesisName}${recLine} matched you exactly at ${Math.round(myRate * 100)}%. The next session decides who blinks.` };
}

/**
 * Session report line — the prose note in the results screen.
 * @param {{ nemesisName: string, myCorrect: number, myTotal: number, theirCorrect: number, theirTotal: number, record?: { wins: number, losses: number, draws: number, total: number }|null }} args
 * @returns {string|null}
 */
export function rivalReport({ nemesisName, myCorrect, myTotal, theirCorrect, theirTotal, record }) {
	const myRate = myTotal === 0 ? 0 : myCorrect / myTotal;
	const theirRate = theirTotal === 0 ? 0 : theirCorrect / theirTotal;
	const outcome = myRate > theirRate ? 'win' : myRate < theirRate ? 'loss' : 'draw';
	const recLine = record && record.total > 0
		? ` — record now ${record.wins}W ${record.losses}L ${record.draws}D`
		: '';

	const m = (r) => Math.round(r * 100);
	if (outcome === 'win') {
		return myRate >= 0.9
			? `You demolished ${nemesisName} — ${m(myRate)}% to their ${m(theirRate)}%.${recLine}`
			: `You beat ${nemesisName} this session — ${m(myRate)}% vs their ${m(theirRate)}%.${recLine}`;
	}
	if (outcome === 'loss') {
		return `${nemesisName} still leads — their ${m(theirRate)}% beats your ${m(myRate)}%.${recLine} Next pass fixes that.`;
	}
	return `Dead even with ${nemesisName} at ${m(myRate)}%.${recLine} The next session decides.`;
}
