/**
 * Server-only assembly of the nemesis dossier used by several pages.
 * Builds the head-to-head record, deck ledger and taunt from store data
 * through the pure engine functions.
 */

import { h2hRecord, tauntFor } from './engine/nemesis.js';

/**
 * @param {import('./data/store.js').Store} store
 * @param {string} userId
 */
export async function getNemesisData(store, userId) {
	const nemesis = await store.findNemesis(userId);
	if (!nemesis) return null;

	const decks = await store.h2hAcrossDecks(userId, nemesis.userId);
	const record = { win: 0, loss: 0, draw: 0 };
	for (const d of decks) {
		const r = h2hRecord({
			myCorrect: d.myCorrect,
			myTotal: d.myTotal,
			theirCorrect: d.theirCorrect,
			theirTotal: d.theirTotal
		});
		record[r.outcome]++;
	}
	const wonDecks = record.win;
	const lostDecks = record.loss;

	const me = await store.getUserSummary(userId);
	const taunt = tauntFor({
		name: nemesis.name,
		record,
		wonDecks,
		lostDecks,
		userStreak: me.streak,
		lastDeckTitle: decks[0]?.deckTitle
	});

	return { nemesis, decks, record, wonDecks, lostDecks, taunt, myStreak: me.streak };
}
