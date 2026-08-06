import { getStore } from '$lib/data/store.js';

export async function load({ cookies, url }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	const leaderboard = await store.leaderboardEntries();
	const myRank = leaderboard.findIndex((e) => e.userId === userId) + 1;

	// Room average per deck (for the you-vs-room bars).
	const perDeck = (await store.getUserSummary(userId)).perDeck;
	const room = {};
	for (const d of perDeck) {
		const peerStats = await store.getPeerStats(d.deckId);
		let correct = 0;
		let total = 0;
		for (const s of peerStats.values()) {
			correct += s.correctCount;
			total += s.totalCount;
		}
		room[d.deckId] = total === 0 ? null : correct / total;
	}

	// Optional challenge target from ?student=userId.
	const targetId = url.searchParams.get('student') ?? null;
	let target = null;
	let h2h = [];
	let duels = [];
	if (targetId && targetId !== userId) {
		target = await store.getUser(targetId);
		if (target) {
			[h2h, duels] = await Promise.all([
				store.h2hAcrossDecks(userId, targetId),
				store.getCardDuels(userId, targetId)
			]);
		}

	// Nemesis data + devices.
	let nemesis = null;
	let nemesisRecord = null;
	let nemesisHistory = [];
	if (userId) {
		nemesis = await store.findNemesis(userId);
		if (nemesis) {
			nemesisRecord = await store.getNemesisRecord(userId, nemesis.userId);
			nemesisHistory = await store.getNemesisHistory(userId, nemesis.userId, 12);
		}
	}
	}

	const top = leaderboard[0] ?? null;
	const me = leaderboard[myRank - 1] ?? null;

	return {
		leaderboard,
		myRank: myRank > 0 ? myRank : leaderboard.length + 1,
		top,
		me,
		perDeck,
		nemesis,
		nemesisRecord,
		nemesisHistory,
		devices: await store.listDevices(userId),
		room,
		target,
		h2h,
		duels: duels.slice(0, 10),
		userId
	};
}
