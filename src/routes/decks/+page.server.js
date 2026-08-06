import { getStore } from '$lib/data/store.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u') ?? null;
	const [decks, summary] = await Promise.all([
		store.getDecks(),
		userId ? store.getUserSummary(userId) : null
	]);
	const progress = new Map();
	if (summary) {
		for (const d of summary.perDeck) {
			progress.set(d.deckId, d.total === 0 ? 0 : d.correct / d.total);
		}
	}
	return { decks, progress, userId };
}
