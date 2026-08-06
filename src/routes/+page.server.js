import { getStore } from '$lib/data/store.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	const [summary, nemesis, user, decks, filters, pool] = await Promise.all([
		store.getUserSummary(userId),
		store.findNemesis(userId),
		userId ? store.getUser(userId) : null,
		store.getDecks(),
		store.getQuestionFilters(),
		store.getQuestions({ limit: 50 })
	]);
	const questionTotal = filters.reduce((a, f) => a + f.count, 0);

	// Nemesis per-question stats for the quick quiz, for the nemesis-aware
	// miss toasts. Convert the Map to a plain object for client lookups.
	let nemesisStats = null;
	if (nemesis) {
		const map = await store.getQuizNemesisStats(userId, 'quick');
		nemesisStats = map ? Object.fromEntries(map) : null;
	}

	return {
		pool: pool.map((q) => ({
			id: q.id,
			question: q.question,
			options: q.options,
			correctIndex: q.answerIndex,
			explanation: q.explanation ?? '',
			sourceQuiz: q.subject
		})),
		questionTotal,
		summary,
		nemesis,
		nemesisStats,
		nemesisName: nemesis?.name ?? null,
		nemesisUserId: nemesis?.userId ?? null,
		userName: user?.name ?? 'Aspirant',
		decks
	};
}
