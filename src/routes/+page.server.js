import { getStore } from '$lib/data/store.js';
import { quickQuizPool } from '$lib/data/quizzes.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	const [summary, nemesis] = await Promise.all([
		store.getUserSummary(userId),
		store.findNemesis(userId)
	]);
	return {
		pool: quickQuizPool(),
		summary,
		nemesis,
		decks: await store.getDecks()
	};
}
