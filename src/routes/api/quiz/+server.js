import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';
import { requestNemesisRoast } from '$lib/engine/aiCoach.js';

export async function POST({ request, cookies }) {
	const userId = cookies.get('smaran_u');
	if (!userId) {
		return json({ error: 'no user' }, { status: 401 });
	}
	const body = await request.json();
	const { quizId, startedAt, endedAt, results, nemesis } = body;
	if (!quizId || !Array.isArray(results) || results.length === 0) {
		return json({ error: 'invalid quiz session' }, { status: 400 });
	}
	const store = await getStore();
	const id = await store.saveQuizSession({ userId, quizId, startedAt, endedAt, results });

	let roast = null;
	try {
		if (nemesis && nemesis.nemesisUserId) {
			const { nemesisUserId, myCorrect, myTotal, theirCorrect, theirTotal, outcome } = nemesis;
			const encounter = await store.recordNemesisEncounter({
				userId, nemesisUserId, quizId, myCorrect: +myCorrect, myTotal: +myTotal,
				theirCorrect: +theirCorrect, theirTotal: +theirTotal, outcome
			});
			const record = await store.getNemesisRecord(userId, nemesisUserId);
			roast = await requestNemesisRoast({
				userName: (await store.getUser(userId))?.name ?? 'You',
				nemesisName: (await store.getUser(nemesisUserId))?.name ?? 'your rival',
				outcome, myScore: +myCorrect, myTotal: +myTotal,
				theirScore: +theirCorrect, theirTotal: +theirTotal,
				record, apiKey: process.env.DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL
			});
			if (roast && encounter.id) await store.setNemesisRoast(encounter.id, roast);
		}
	} catch {
		// Nemesis roast is best-effort; never fail the quiz save for it.
	}

	return json({ id, roast });
}
