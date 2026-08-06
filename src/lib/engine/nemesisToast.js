/**
 * Nemesis-aware toast engine. Pure and deterministic: every message is a
 * function of the user's own miss count and what the nemesis actually did.
 *
 * @typedef {object} ToastData
 * @property {'success'|'error'|'warning'} tone
 * @property {string} title
 * @property {string} body
 */

/**
 * Escalating feedback for a repeated miss on the same card/question.
 *
 * @param {object} args
 * @param {number} args.missCount      times this item has been missed (1+)
 * @param {number|null} args.nemesisRate  fraction of nemesis attempts correct on this item
 * @param {string} args.nemesisName
 * @param {string|null} args.correctText  the correct answer text (for the first miss)
 * @returns {ToastData}
 */
export function missToast({ missCount, nemesisRate, nemesisName, correctText }) {
	if (missCount >= 3) {
		const rivalLine =
			nemesisRate != null && nemesisRate > 0.5
				? `${nemesisName} answers this one correctly more often than not. They are pulling away.`
				: `${nemesisName} is watching. Read the answer aloud, then test yourself again in 10 minutes.`;
		return {
			tone: 'error',
			title: 'Nemesis is watching',
			body: `Third miss on this card. ${rivalLine}`
		};
	}
	if (missCount === 2) {
		const rivalLine =
			nemesisRate != null && nemesisRate > 0.5
				? `${nemesisName} got this right on their last attempt. You can too.`
				: 'Say the answer out loud before rating — it forces the recall path.';
		return {
			tone: 'warning',
			title: 'Twice on the same card',
			body: `${rivalLine} The scheduler will bring it back soon; make the next one count.`
		};
	}
	// First miss: standard toast with the key text.
	return {
		tone: 'error',
		title: 'Not quite',
		body: correctText ? `The answer was: ${correctText}` : 'Review this one.'
	};
}

/**
 * Session-end nemesis line based on how the user did against the nemesis.
 *
 * @param {object} args
 * @param {number} args.myCorrect
 * @param {number} args.myTotal
 * @param {number} args.theirCorrect
 * @param {number} args.theirTotal
 * @param {string} args.nemesisName
 * @returns {string}
 */
export function rivalReport({ myCorrect, myTotal, theirCorrect, theirTotal, nemesisName }) {
	const myRate = myTotal === 0 ? 0 : myCorrect / myTotal;
	const theirRate = theirTotal === 0 ? 0 : theirCorrect / theirTotal;
	if (myRate > theirRate) {
		return `You beat ${nemesisName} this time — ${Math.round(myRate * 100)}% vs their ${Math.round(theirRate * 100)}%. Savor it.`;
	}
	if (myRate < theirRate) {
		return `${nemesisName} still leads — ${Math.round(theirRate * 100)}% vs your ${Math.round(myRate * 100)}%. The next session is a rematch.`;
	}
	return `Dead even with ${nemesisName}. The next session decides who blinks.`;
}

/**
 * Friendly roast — the nemesis teasing the user, never mean. Deterministic:
 * which line is picked depends on the actual numbers.
 *
 * @param {object} args
 * @param {string} args.nemesisName
 * @param {number} args.missCount        consecutive/same-item misses this session
 * @param {number} args.sessionScore
 * @param {number} args.sessionTotal
 * @param {boolean} args.beatNemesis     did the user beat the nemesis this session
 * @returns {string}
 */
export function roast({ nemesisName, missCount, sessionScore, sessionTotal, beatNemesis }) {
	if (beatNemesis) {
		return `${nemesisName} will pretend that session never happened.`;
	}
	if (missCount >= 3) {
		const lines = [
			`${nemesisName} is literally keeping count of your misses. Third one today.`,
			`Three misses in one session — ${nemesisName} calls that "generous".`,
			`Your nemesis has missed fewer things in their whole life than you did just now.`
		];
		return lines[missCount % lines.length];
	}
	if (sessionTotal > 0 && sessionScore / sessionTotal < 0.5) {
		const lines = [
			`${sessionScore}/${sessionTotal}? ${nemesisName} did better in their warm-up.`,
			`Careful — ${nemesisName} might start feeling bad for you.`,
			`${nemesisName} saw that score and smiled. Unsettling, right?`
		];
		return lines[(missCount * 7 + 1) % lines.length];
	}
	return `${nemesisName} is watching. That alone should be enough motivation.`;
}
