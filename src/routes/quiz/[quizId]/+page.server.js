import { error } from '@sveltejs/kit';
import { QUIZZES } from '$lib/data/quizzes.js';
import { getStore } from '$lib/data/store.js';

export async function load({ params, cookies }) {
	const quiz = QUIZZES.find((q) => q.id === params.quizId);
	if (!quiz) error(404, 'Quiz not found');

	const userId = cookies.get('smaran_u') ?? null;
	const store = await getStore();

	let user = null;
	let peerStats = new Map();
	let nemesisStats = null;
	let nemesisName = null;
	if (userId) {
		user = await store.getUser(userId);
		const [peers, ns, nemesis] = await Promise.all([
			store.getQuizPeerStats(quiz.id),
			store.getQuizNemesisStats(userId, quiz.id),
			store.findNemesis(userId)
		]);
		peerStats = peers;
		nemesisStats = ns;
		nemesisName = nemesis?.name ?? null;
	}

	return {
		quiz,
		user,
		userId,
		peerStats: Object.fromEntries(peerStats),
		nemesisStats: nemesisStats ? Object.fromEntries(nemesisStats) : null,
		nemesisName
	};
}
