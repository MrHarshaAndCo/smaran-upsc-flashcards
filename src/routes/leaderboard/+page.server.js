import { getStore } from '$lib/data/store.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u') ?? null;
	const [decks, global] = await Promise.all([store.getDecks(), store.leaderboardEntries()]);
	const perDeck = {};
	for (const d of decks) {
		perDeck[d.id] = await store.leaderboardEntries(d.id);
	}
	return { decks, global, perDeck, userId };
}
