import { redirect } from '@sveltejs/kit';
import { QUIZZES } from '$lib/data/quizzes.js';
import { getStore } from '$lib/data/store.js';
import { getNemesisData } from '$lib/nemesisData.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	if (!userId) redirect(307, '/');
	const user = await store.getUser(userId);
	if (!user) redirect(307, '/');

	const [summary, sessions, leaderboard, nemesis, devices, quizSessions] = await Promise.all([
		store.getUserSummary(userId),
		store.getUserSessions(userId, 6),
		store.leaderboardEntries(),
		getNemesisData(store, userId),
		store.listDevices(userId),
		store.getUserQuizSessions(userId, 6)
	]);

	// Room average accuracy per deck (for the radar chart overlay).
	const roomDeckAccuracy = {};
	for (const d of summary.perDeck) {
		const peerStats = await store.getPeerStats(d.deckId);
		let correct = 0;
		let total = 0;
		for (const s of peerStats.values()) {
			correct += s.correctCount;
			total += s.totalCount;
		}
		roomDeckAccuracy[d.deckId] = total === 0 ? null : correct / total;
	}

	const quizTitles = new Map(QUIZZES.map((q) => [q.id, q]));
	quizTitles.set('quick', { title: 'Quick Quiz', emoji: '⚡' });

	const rank = leaderboard.findIndex((e) => e.userId === userId) + 1;
	const leader = leaderboard[0] ?? null;

	return {
		user,
		summary,
		sessions,
		leaderboard: leaderboard.slice(0, 5),
		rank,
		leader,
		nemesis,
		devices,
		quizSessions,
		quizTitles: Object.fromEntries(quizTitles),
		roomDeckAccuracy
	};
}
