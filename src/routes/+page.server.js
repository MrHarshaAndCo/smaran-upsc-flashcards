import { getStore } from '$lib/data/store.js';
import { QUIZZES, quickQuizPool } from '$lib/data/quizzes.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	const [summary, nemesis, user, decks] = await Promise.all([
		store.getUserSummary(userId),
		store.findNemesis(userId),
		userId ? store.getUser(userId) : null,
		store.getDecks()
	]);

	// Nemesis per-question stats across the whole merged pool, for the
	// nemesis-aware miss toasts.
	let nemesisStats = null;
	if (nemesis) {
		const parts = await Promise.all(QUIZZES.map((q) => store.getQuizNemesisStats(userId, q.id)));
		nemesisStats = {};
		for (const part of parts) {
			if (part) for (const [k, v] of part) nemesisStats[k] = v;
		}
	}

	return {
		pool: quickQuizPool(),
		summary,
		nemesis,
		nemesisStats,
		nemesisName: nemesis?.name ?? null,
		nemesisUserId: nemesis?.userId ?? null,
		userName: user?.name ?? 'Aspirant',
		decks
	};
}
