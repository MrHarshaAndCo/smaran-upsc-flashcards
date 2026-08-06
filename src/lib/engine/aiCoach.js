/**
 * AI coaching engine. When a session goes badly (default: under 50%), the app
 * asks a DeepSeek model for a short, tough-love coaching message tailored to
 * the actual mistakes. Deterministic fallback exists when no API key is set.
 */

/** When a session score is low enough to warrant an AI coach. */
export function shouldUseAi(score, total) {
	return total > 0 && score / total < 0.5;
}

/**
 * Build the conversation for DeepSeek.
 * @param {object} args
 * @param {string} args.name
 * @param {number} args.score
 * @param {number} args.total
 * @param {Array<{ question: string, correct: boolean }>} args.items  recent answers
 * @returns {{ system: string, user: string }}
 */
export function buildCoachPrompt({ name, score, total, items }) {
	const wrong = items.filter((i) => !i.correct).map((i) => `- ${i.question}`).slice(0, 5);
	const right = items.filter((i) => i.correct).length;
	const system =
		'You are the exam coach for a UPSC (India civil services) prep app called The Makkhali Project. ' +
		'You are direct, warm, and specific — never generic. One or two sentences max. ' +
		'Reference the student by name and the actual questions they missed. No emojis.';
	const user = [
		`${name} just scored ${score}/${total} (${right} correct) on a practice session.`,
		wrong.length > 0
			? `Questions they missed:\n${wrong.join('\n')}`
			: 'They missed nothing on this list.',
		'Give them one clear, honest piece of advice for the next session.'
	].join('\n\n');
	return { system, user };
}

/**
 * @param {object} args
 * @param {string} args.name
 * @param {number} args.score
 * @param {number} args.total
 * @param {Array<{ question: string, correct: boolean }>} args.items
 * @param {string} [args.apiKey]
 * @param {string} [args.model]
 * @returns {Promise<{ ai: boolean, message: string }>}
 */
export async function requestCoach({ name, score, total, items, apiKey, model }) {
	if (!apiKey) {
		return { ai: false, message: deterministicCoach(score, total) };
	}
	const { system, user } = buildCoachPrompt({ name, score, total, items });
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 15000);
		const res = await fetch('https://api.deepseek.com/chat/completions', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: model ?? 'deepseek-chat',
				messages: [
					{ role: 'system', content: system },
					{ role: 'user', content: user }
				],
				max_tokens: 180,
				temperature: 0.8
			}),
			signal: controller.signal
		});
		clearTimeout(timer);
		if (!res.ok) throw new Error(`deepseek ${res.status}`);
		const data = await res.json();
		const message = data?.choices?.[0]?.message?.content?.trim();
		if (!message) throw new Error('empty completion');
		return { ai: true, message };
	} catch {
		return { ai: false, message: deterministicCoach(score, total) };
	}
}

/** Offline fallback — still tailored to the score band. */
export function deterministicCoach(score, total) {
	const rate = total === 0 ? 0 : score / total;
	if (rate >= 0.4) {
		return 'Borderline, but the floor is visible. The questions you missed are your real syllabus — redo them before anything new.';
	}
	return 'That score is information, not identity. You missed what you have not studied deliberately enough. Take the missed set, read each answer aloud, and come back in 24 hours — expect the curve to bend.';
}

/**
 * DeepSeek-generated nemesis roast, aware of the full duel history.
 */
export async function requestNemesisRoast({
	userName, nemesisName, outcome, myScore, myTotal, theirScore, theirTotal, record, apiKey, model
}) {
	const system = [
		'You are a friendly study rival in a UPSC exam prep app called The Makkhali Project.',
		'Write ONE sentence — a playful, motivating roast — based on the head-to-head record.',
		'Reference the history if there is one, the current outcome, and use the student names.',
		'Never mean. Always push. No emojis.'
	].join(' ');
	const myRate = myTotal ? Math.round((myScore / myTotal) * 100) : 0;
	const theirRate = theirTotal ? Math.round((theirScore / theirTotal) * 100) : 0;
	const user = [
		`${userName} scored ${myRate}% vs ${nemesisName} ${theirRate}% (${outcome}).`,
		`Record: ${record.wins} wins, ${record.losses} losses, ${record.draws} draws across ${record.total} encounters.`,
		record.total >= 2 ? 'Acknowledge the history. One sentence.' : 'First encounter — welcome the rivalry. One sentence.'
	].join('\n');
	if (!apiKey) return deterministicNemesisRoast({ outcome, myRate, theirRate, record, userName, nemesisName });
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 12000);
		const res = await fetch('https://api.deepseek.com/chat/completions', {
			method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
			body: JSON.stringify({ model: model ?? 'deepseek-chat', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: 120, temperature: 0.9 }),
			signal: controller.signal
		});
		clearTimeout(timer);
		if (!res.ok) throw new Error(`deepseek ${res.status}`);
		const data = await res.json();
		return data?.choices?.[0]?.message?.content?.trim() || deterministicNemesisRoast({ outcome, myRate, theirRate, record, userName, nemesisName });
	} catch {
		return deterministicNemesisRoast({ outcome, myRate, theirRate, record, userName, nemesisName });
	}
}

export function deterministicNemesisRoast({ outcome, myRate, theirRate, record, userName, nemesisName }) {
	if (record.total >= 3 && outcome === 'loss') return `${nemesisName} leads ${record.wins}-${record.losses}. ${userName}, the gap is real — close it before it becomes tradition.`;
	if (outcome === 'win' && record.wins >= 2) return `${userName} just took that round from ${nemesisName} — ${record.wins}-${record.losses} now. The comeback arc is writing itself.`;
	if (outcome === 'win') return `First win against ${nemesisName}. Mark the date — rivalries look back at the first one.`;
	if (outcome === 'loss') return `${myRate}% vs ${theirRate}%. ${nemesisName} will remember that — make them remember the next one too.`;
	return `Dead even at ${myRate}%. The next round at ${nemesisName}'s pace decides.`;
}
