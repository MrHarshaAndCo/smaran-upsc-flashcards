import { error } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function load({ params, cookies }) {
	const store = await getStore();
	const deck = await store.getDeck(params.deckId);
	if (!deck) error(404, 'Deck not found');

	const userId = cookies.get('smaran_u') ?? null;
	const [cards, peerStats] = await Promise.all([
		store.getCards(deck.id),
		store.getPeerStats(deck.id)
	]);

	let user = null;
	let cardStates = new Map();
	let myMeta = new Map();
	let nemesisStats = null;
	let nemesisName = null;
	let nemesisAvatar = null;
	if (userId) {
		user = await store.getUser(userId);
		const [states, meta, ns, nemesis] = await Promise.all([
			store.getCardStates(userId),
			store.getMyCardMeta(userId, deck.id),
			store.getNemesisStats(userId, deck.id),
			store.findNemesis(userId)
		]);
		cardStates = states;
		myMeta = meta;
		nemesisStats = ns;
		nemesisName = nemesis?.name ?? null;
		nemesisUserId = nemesis?.userId ?? null,
		nemesisAvatar = nemesis?.avatar ?? null;
	}

	return {
		deck,
		cards,
		user,
		userId,
		cardStates: Object.fromEntries(cardStates),
		myMeta: Object.fromEntries(myMeta),
		peerStats: Object.fromEntries(peerStats),
		nemesisStats: nemesisStats ? Object.fromEntries(nemesisStats) : null,
		nemesisName,
		nemesisAvatar
	};
}
