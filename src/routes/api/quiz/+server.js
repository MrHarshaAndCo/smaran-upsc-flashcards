import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

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

	// Nemesis encounter — record the duel (fast DB), verdict is computed client-side.
	if (nemesis && nemesis.nemesisUserId) {
		try {
			const { nemesisUserId, myCorrect, myTotal, theirCorrect, theirTotal, outcome } = nemesis;
			await store.recordNemesisEncounter({
				userId, nemesisUserId, quizId, myCorrect: +myCorrect, myTotal: +myTotal,
				theirCorrect: +theirCorrect, theirTotal: +theirTotal, outcome
			});
		} catch {
			// Nemesis record is best-effort; never fail the quiz save for it.
		}
	}

	return json({ id });
}
