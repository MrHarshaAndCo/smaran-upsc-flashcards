import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function POST({ request, cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	if (!userId) return json({ error: 'Not logged in' }, { status: 401 });

	const body = await request.json().catch(() => ({}));
	const name = String(body.name ?? '').trim();
	if (name.length < 2 || name.length > 40) {
		return json({ error: 'Group name must be 2–40 characters.' }, { status: 400 });
	}
	const emoji = String(body.emoji ?? '👥').trim().slice(0, 4) || '👥';
	const description = String(body.description ?? '').trim().slice(0, 120) || null;

	const { id } = await store.createGroup({ name, emoji, description, userId });
	return json({ id, name, emoji, description });
}
