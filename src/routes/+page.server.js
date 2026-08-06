import { getStore } from '$lib/data/store.js';
import { QUIZZES } from '$lib/data/quizzes.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	// Quick quiz on the home page — the mixed grand test is a good fast set.
	const quiz = QUIZZES.find((q) => q.id === 'quiz-mixed') ?? QUIZZES[0];

	const [summary, nemesis] = await Promise.all([
		store.getUserSummary(userId),
		store.findNemesis(userId)
	]);

	return { quiz, summary, nemesis };
}
