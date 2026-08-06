import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function POST({ request, cookies }) {
	const store = await getStore();
	const userId = cookies.get('smaran_u');
	if (!userId) return json({ error: 'Not logged in' }, { status: 401 });

	const body = await request.json().catch(() => ({}));
	const groupId = String(body.groupId ?? '');
	if (!groupId) return json({ error: 'Missing group.' }, { status: 400 });

	await store.leaveGroup(groupId, userId);
	return json({ ok: true });
}
