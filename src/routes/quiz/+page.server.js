import { QUIZZES } from '$lib/data/quizzes.js';

export async function load() {
	return { quizzes: QUIZZES };
}
