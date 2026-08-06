import { getStore } from '$lib/data/store.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u') ?? null;
	if (!userId) return { deck: null, cards: [], cardStates: {}, peerStats: {}, myMeta: {}, nemesisStats: null, nemesisName: null, nemesisUserId: null, user: null };
	return store.getStudyContext(userId);
}
