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
