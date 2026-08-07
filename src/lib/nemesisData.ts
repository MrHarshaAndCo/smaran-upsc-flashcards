import { h2hRecord, tauntFor, getNemesisRecommendations, type LeaderEntry, type DeckDuelData, type NemesisRecommendation } from './engine/nemesis.js';

export interface NemesisDossierData {
	nemesis: LeaderEntry;
	decks: DeckDuelData[];
	record: { win: number; loss: number; draw: number };
	wonDecks: number;
	lostDecks: number;
	taunt: string;
	myStreak: number;
	recommendations: NemesisRecommendation;
}

export async function getNemesisData(store: any, userId: string): Promise<NemesisDossierData | null> {
	const nemesis = await store.findNemesis(userId);
	if (!nemesis) return null;

	const decks: DeckDuelData[] = await store.h2hAcrossDecks(userId, nemesis.userId);
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
	const allEntries: LeaderEntry[] = await store.leaderboardEntries();

	const taunt = tauntFor({
		name: nemesis.name,
		record,
		wonDecks,
		lostDecks,
		userStreak: me.streak,
		lastDeckTitle: decks[0]?.deckTitle
	});

	const recommendations = getNemesisRecommendations(userId, allEntries, decks);

	return { nemesis, decks, record, wonDecks, lostDecks, taunt, myStreak: me.streak, recommendations };
}
