import { getStore } from '$lib/data/store.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u') ?? null;
	const [decks, global] = await Promise.all([store.getDecks(), store.leaderboardEntries()]);
	const perDeck = Object.fromEntries(
		await Promise.all(decks.map(async (d) => [d.id, await store.leaderboardEntries(d.id)]))
	);
	const stats = {
		activeStudents: global.length,
		totalReviews: global.reduce((a, e) => a + e.reviews, 0),
		topName: global[0]?.name ?? null,
		topAvatar: global[0]?.avatar ?? null,
		topAccuracy: global[0]?.accuracy ?? null,
		podium: global.slice(0, 3)
	};
	return { decks, global, perDeck, userId, stats };
}
