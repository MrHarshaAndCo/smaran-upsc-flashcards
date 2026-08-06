import { error } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function load({ params, cookies }) {
	const store = await getStore();
	const deck = await store.getDeck(params.deckId);
	if (!deck) error(404, 'Deck not found');

	const userId = cookies.get('smaran_u') ?? null;
	const [cards, entries, peerStats, userSummary] = await Promise.all([
		store.getCards(deck.id),
		store.leaderboardEntries(deck.id),
		store.getPeerStats(deck.id),
		userId ? store.getUserSummary(userId) : null
	]);

	let myDeck = null;
	if (userSummary) myDeck = userSummary.perDeck.find((d) => d.deckId === deck.id) ?? null;

	let nemesis = null;
	let duels = [];
	if (userId) {
		nemesis = await store.findNemesis(userId);
		if (nemesis) {
			duels = await store.getCardDuels(userId, nemesis.userId, deck.id);
		}
	}

	let peerCorrect = 0;
	let peerTotal = 0;
	for (const s of peerStats.values()) {
		peerCorrect += s.correctCount;
		peerTotal += s.totalCount;
	}

	return {
		deck,
		cards,
		entries,
		myDeck,
		userId,
		nemesis,
		duels: duels.slice(0, 5),
		peerAccuracy: peerTotal === 0 ? null : peerCorrect / peerTotal
	};
}
