import { getStore } from '$lib/data/store.js';

// Room averages change only when anyone reviews — tolerate 60s staleness.
const ROOM_TTL = 60 * 1000;
let roomCache = { key: null, at: 0, room: null };

export async function load({ cookies, url }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u') ?? null;

	// Batch 1 — everything independent, in parallel.
	const [leaderboard, summary, nemesis, devices, myGroups, groups, users] = await Promise.all([
		store.leaderboardEntries(),
		store.getUserSummary(userId),
		userId ? store.findNemesis(userId) : null,
		store.listDevices(userId),
		store.getUserGroups(userId),
		store.listGroups({ userId }),
		userId ? store.listUsers() : []
	]);
	const myRank = leaderboard.findIndex((e) => e.userId === userId) + 1;

	// Member leaderboards for groups the user belongs to (small set).
	const myGroupDetails = await Promise.all(myGroups.map((g) => store.getGroup(g.id)));

	// Room average per deck (for the you-vs-room bars).
	const perDeck = summary.perDeck;
	const roomKey = perDeck.map((d) => d.deckId).sort().join(',');
	let room;
	if (roomCache.key === roomKey && Date.now() - roomCache.at < ROOM_TTL) {
		room = roomCache.room;
	} else {
		room = Object.fromEntries(
			await Promise.all(
				perDeck.map(async (d) => {
					const peerStats = await store.getPeerStats(d.deckId);
					let correct = 0;
					let total = 0;
					for (const s of peerStats.values()) {
						correct += s.correctCount;
						total += s.totalCount;
					}
					return [d.deckId, total === 0 ? null : correct / total];
				})
			)
		);
		roomCache = { key: roomKey, at: Date.now(), room };
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
	}

	// Nemesis data.
	let nemesisRecord = null;
	let nemesisHistory = [];
	if (nemesis) {
		[nemesisRecord, nemesisHistory] = await Promise.all([
			store.getNemesisRecord(userId, nemesis.userId),
			store.getNemesisHistory(userId, nemesis.userId, 12)
		]);
	}

	const top = leaderboard[0] ?? null;
	const me = leaderboard[myRank - 1] ?? null;

	const userAccuracy = new Map(leaderboard.map((e) => [e.userId, e]));

	return {
		leaderboard,
		myRank: myRank > 0 ? myRank : leaderboard.length + 1,
		top,
		me,
		perDeck,
		nemesis,
		nemesisRecord,
		nemesisHistory,
		devices,
		room,
		target,
		h2h,
		duels: duels.slice(0, 10),
		groups,
		myGroupDetails,
		users: users.map((u) => {
			const e = userAccuracy.get(u.id);
			return {
				id: u.id,
				name: u.name,
				avatar: u.avatar,
				accuracy: e?.accuracy ?? null,
				reviews: e?.reviews ?? 0
			};
		}),
		userId
	};
}
