import { getStore } from '$lib/data/store.js';

export async function load() {
	const store = await getStore();
	const [filters] = await Promise.all([store.getQuestionFilters()]);
	return { filters };
}
