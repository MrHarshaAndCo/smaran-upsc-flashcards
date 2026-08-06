import { redirect } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';
import { getNemesisData } from '$lib/nemesisData.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	if (!userId) redirect(307, '/colab');
	const user = await store.getUser(userId);
	if (!user) redirect(307, '/colab');

	const nemesis = await getNemesisData(store, userId);
	let duels = [];
	if (nemesis) {
		duels = await store.getCardDuels(userId, nemesis.nemesis.userId);
	}
	return { user, nemesis, duels: duels.slice(0, 12) };
}
