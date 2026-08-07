import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function POST({ request, cookies }) {
	const userId = cookies.get('smaran_u');
	if (!userId) return json({ error: 'no user' }, { status: 401 });
	const { name } = await request.json().catch(() => ({}));
	const store = await getStore();
	const user = await store.updateProfile(userId, { name });
	if (!user) return json({ error: 'user not found' }, { status: 404 });
	return json({ user });
}
