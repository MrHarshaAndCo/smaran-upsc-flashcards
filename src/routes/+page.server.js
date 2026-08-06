import { getStore } from '$lib/data/store.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u') ?? null;
	const [decks, leaderboard] = await Promise.all([store.getDecks(), store.leaderboardEntries()]);
	let nemesis = null;
	let summary = null;
	if (userId) {
		const [n, s] = await Promise.all([store.findNemesis(userId), store.getUserSummary(userId)]);
		nemesis = n;
		summary = s;
	}
	const totalCards = decks.reduce((a, d) => a + d.cardCount, 0);
	return { decks, leaderboard: leaderboard.slice(0, 5), userId, nemesis, summary, totalCards, peerCount: leaderboard.length };
}
