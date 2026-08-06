/**
 * Nemesis-aware toast engine — pure data-driven feedback.
 */

export interface ToastData {
	tone: 'success' | 'error' | 'warning' | 'neutral';
	title: string;
	body: string;
}

/**
 * Escalating feedback for a repeated miss on the same card/question.
 */
export function missToast({
	missCount,
	nemesisRate,
	nemesisName,
	correctText
}: {
	missCount: number;
	nemesisRate: number | null;
	nemesisName: string;
	correctText: string | null;
}): ToastData {
	if (missCount >= 3) {
		const nemLine =
			nemesisRate == null || nemesisRate <= 0
				? `${nemesisName} hasn't even seen this one.`
				: `${nemesisName} gets this right ${Math.round(nemesisRate * 100)}% of the time.`;
		return {
			tone: 'error',
			title: 'Persistent blind spot',
			body: `You've missed this ${missCount} times now. ${nemLine} Burn it into memory!`
		};
	}
	if (missCount === 2) {
		const nemLine =
			nemesisRate == null
				? ''
				: ` ${nemesisName} nails this ${Math.round(nemesisRate * 100)}% of the time.`;
		return {
			tone: 'warning',
			title: 'Second miss',
			body: `You missed this one twice now.${nemLine} Repetition is key.`
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
 * Session-end nemesis verdict.
 */
export function nemesisVerdict({
	userName,
	nemesisName,
	myScore,
	myTotal,
	theirScore,
	theirTotal,
	record
}: {
	userName: string;
	nemesisName: string;
	myScore: number;
	myTotal: number;
	theirScore: number;
	theirTotal: number;
	record?: { wins: number; losses: number; draws: number; total: number } | null;
}): ToastData {
	const myRate = myTotal === 0 ? 0 : myScore / myTotal;
	const theirRate = theirTotal === 0 ? 0 : theirScore / theirTotal;
	const gap = Math.abs(myRate - theirRate);
	const outcome = myRate > theirRate ? 'win' : myRate < theirRate ? 'loss' : 'draw';

	const recLine = record && record.total > 0
		? ` (${record.wins}–${record.losses}–${record.draws})`
		: '';

	if (outcome === 'win') {
		if (myRate >= 0.95) {
			return { tone: 'success', title: 'Uncatchable', body: `${Math.round(myRate * 100)}% — almost perfect. ${nemesisName}${recLine} can't touch this round.` };
		}
		if (myRate >= 0.8 && gap >= 0.3) {
			return { tone: 'success', title: 'Dominant', body: `A ${Math.round(gap * 100)}pp gap over ${nemesisName}${recLine}. You're in a different league right now.` };
		}
		if (record && record.wins >= 3 && record.wins > record.losses * 2) {
			return { tone: 'success', title: 'Winning streak', body: `${nemesisName}${recLine} can't find a foothold — momentum is yours.` };
		}
		return { tone: 'success', title: 'Victory', body: `${nemesisName}${recLine} had no answer to ${Math.round(myRate * 100)}%. The ledger tilts your way.` };
	}

	if (outcome === 'loss') {
		if (theirRate >= 0.9 && myRate < 0.6) {
			return { tone: 'warning', title: 'Outclassed', body: `${nemesisName}${recLine} hit ${Math.round(theirRate * 100)}% while you landed at ${Math.round(myRate * 100)}%. Use this session as fuel.` };
		}
		if (gap < 0.08) {
			return { tone: 'warning', title: 'So close', body: `${Math.round(gap * 100)}pp from ${nemesisName}${recLine}. ${Math.round(myRate * 100)}% vs ${Math.round(theirRate * 100)}% — next round is yours.` };
		}
		return { tone: 'warning', title: 'Nemesis lead', body: `${nemesisName}${recLine} takes this one — ${Math.round(theirRate * 100)}% to your ${Math.round(myRate * 100)}%.` };
	}

	return { tone: 'neutral', title: 'Dead even', body: `${nemesisName}${recLine} matched you exactly at ${Math.round(myRate * 100)}%. The next session decides.` };
}

/**
 * Session report line.
 */
export function rivalReport({
	nemesisName,
	myCorrect,
	myTotal,
	theirCorrect,
	theirTotal,
	record
}: {
	nemesisName: string;
	myCorrect: number;
	myTotal: number;
	theirCorrect: number;
	theirTotal: number;
	record?: { wins: number; losses: number; draws: number; total: number } | null;
}): string | null {
	const myRate = myTotal === 0 ? 0 : myCorrect / myTotal;
	const theirRate = theirTotal === 0 ? 0 : theirScore / theirTotal;
	const outcome = myRate > theirRate ? 'win' : myRate < theirRate ? 'loss' : 'draw';
	const recLine = record && record.total > 0
		? ` — record now ${record.wins}W ${record.losses}L ${record.draws}D`
		: '';

	const m = (r: number) => Math.round(r * 100);
	if (outcome === 'win') {
		return `You beat ${nemesisName} this session — ${m(myRate)}% vs their ${m(theirRate)}%.${recLine}`;
	}
	if (outcome === 'loss') {
		return `${nemesisName} still leads — their ${m(theirRate)}% beats your ${m(myRate)}%.${recLine} Next pass fixes that.`;
	}
	return `Dead even with ${nemesisName} at ${m(myRate)}%.${recLine} The next session decides.`;
}
