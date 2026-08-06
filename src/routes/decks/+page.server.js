import { getStore } from '$lib/data/store.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u') ?? null;
	const [decks, summary, states] = await Promise.all([
		store.getDecks(),
		userId ? store.getUserSummary(userId) : null,
		userId ? store.getCardStates(userId) : null
	]);

	const perDeck = new Map();
	if (summary) for (const d of summary.perDeck) perDeck.set(d.deckId, d);

	// Attribute studied cards to their deck so we can count never-touched cards.
	const cardsByDeck = await Promise.all(
		decks.map(async (deck) => [deck.id, await store.getCards(deck.id)])
	);
	const deckOfCard = new Map();
	for (const [deckId, cards] of cardsByDeck) {
		for (const c of cards) deckOfCard.set(c.id, deckId);
	}

	const deckStats = decks.map((deck) => {
		const d = perDeck.get(deck.id);
		let studied = 0;
		if (states) for (const cardId of states.keys()) if (deckOfCard.get(cardId) === deck.id) studied++;
		return {
			deck,
			progress: d && d.total > 0 ? d.correct / d.total : 0,
			due: d?.due ?? 0,
			newCards: Math.max(0, deck.cardCount - studied)
		};
	});

	const dueTotal = deckStats.reduce((a, s) => a + s.due, 0);
	const newTotal = deckStats.reduce((a, s) => a + s.newCards, 0);

	return { deckStats, dueTotal, newTotal, userId };
}
