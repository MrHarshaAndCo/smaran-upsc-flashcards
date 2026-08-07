/**
 * Toast notifications for rival/nemesis events.
 * Pure deterministic feedback generation based on real score/performance numbers.
 */

export interface MissToastArgs {
	missCount: number;
	nemesisRate: number | null;
	nemesisName: string;
	correctText?: string;
}

export interface ToastMessage {
	tone: 'error' | 'warning' | 'neutral' | 'success';
	title: string;
	body: string;
}

export function missToast({ missCount, nemesisRate, nemesisName, correctText }: MissToastArgs): ToastMessage {
	if (nemesisRate !== null && nemesisRate > 0.7) {
		return {
			tone: 'error',
			title: `Rival ${nemesisName} got this right!`,
			body: `${nemesisName} solved this correctly (${Math.round(nemesisRate * 100)}% accuracy). ${correctText ? `Answer: ${correctText}` : 'Review this card.'}`
		};
	}
	if (missCount > 1) {
		return {
			tone: 'warning',
			title: `Missed ${missCount} times this round`,
			body: `Pace yourself — ${correctText ? `Correct: ${correctText}` : 'study the explanation below.'}`
		};
	}
	return {
		tone: 'warning',
		title: 'Lapse recorded',
		body: correctText ? `Correct answer: ${correctText}` : 'Review explanation below and try again.'
	};
}

export function nemesisVerdict({
	nemesisName,
	myScore,
	myTotal,
	theirScore,
	theirTotal,
	record
}: {
	nemesisName: string;
	myScore: number;
	myTotal: number;
	theirScore: number;
	theirTotal: number;
	record?: any;
}): ToastMessage {
	const myPct = myTotal > 0 ? myScore / myTotal : 0;
	const theirPct = theirTotal > 0 ? theirScore / theirTotal : 0;

	if (myPct > theirPct) {
		return {
			tone: 'success',
			title: `⚔️ Victory over ${nemesisName}!`,
			body: `You scored ${Math.round(myPct * 100)}% vs ${nemesisName}'s ${Math.round(theirPct * 100)}%. You took this round!`
		};
	} else if (myPct < theirPct) {
		return {
			tone: 'error',
			title: `⚔️ Rival ${nemesisName} leads!`,
			body: `${nemesisName} scored ${Math.round(theirPct * 100)}% vs your ${Math.round(myPct * 100)}%. Review missed cards to reclaim top spot.`
		};
	}
	return {
		tone: 'neutral',
		title: `⚔️ Tie match vs ${nemesisName}!`,
		body: `Both of you scored ${Math.round(myPct * 100)}%. Next round decides who takes the lead!`
	};
}

export function rivalReport(nemesisName: string, myPct: number, theirPct: number): ToastMessage {
	return nemesisVerdict({
		nemesisName,
		myScore: myPct,
		myTotal: 100,
		theirScore: theirPct,
		theirTotal: 100
	});
}
