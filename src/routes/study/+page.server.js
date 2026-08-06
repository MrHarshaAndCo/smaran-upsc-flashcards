import { getStore } from '$lib/data/store.js';

export async function load() {
	const store = await getStore();
	const [decks, filters] = await Promise.all([
		store.getDecks(),
		store.getQuestionFilters()
	]);
	return { decks, filters };
}
