import { getStore } from '$lib/data/store.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	const user = userId ? await store.getUser(userId) : null;
	return { user };
}
