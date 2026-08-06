import { getStore } from '$lib/data/store.js';

export async function load() {
	const store = await getStore();
	const [filters, questions] = await Promise.all([
		store.getQuestionFilters(),
		store.getQuestions({ limit: 50 })
	]);
	return { filters, questions };
}
