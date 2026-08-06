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
	let nemesisStats = null;
	let nemesisRecord = null;
	if (nemesis) {
		const [map, record] = await Promise.all([
			store.getQuizNemesisStats(userId, 'quick'),
			store.getNemesisRecord(userId, nemesis.userId)
		]);
		nemesisStats = map ? Object.fromEntries(map) : null;
		nemesisRecord = record;
	}

	return {
		filters,
		pool: pool.map((q) => ({
			id: q.id,
			question: q.question,
			options: q.options,
			correctIndex: q.answerIndex,
			explanation: q.explanation ?? '',
			sourceQuiz: q.subject
		})),
		questionTotal,
		userName: user?.name ?? 'Aspirant',
		summary,
		nemesisRecord,
		nemesis,
		nemesisStats,
		nemesisName: nemesis?.name ?? null,
		nemesisUserId: nemesis?.userId ?? null,
		decks
	};
}
