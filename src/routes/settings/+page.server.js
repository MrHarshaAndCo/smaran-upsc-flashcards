import { redirect } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function load({ cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	if (!userId) redirect(307, '/login');
	const user = await store.getUser(userId);
	if (!user) redirect(307, '/login');
	return { user };
}
