import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function POST({ request, cookies }) {
	const userId = cookies.get('smaran_u');
	if (!userId) return json({ error: 'no user' }, { status: 401 });
	const { currentPassword, newPassword } = await request.json().catch(() => ({}));
	if (!currentPassword || !newPassword || newPassword.length < 6) {
		return json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
	}
	const store = await getStore();
	const ok = await store.changePassword(userId, currentPassword, newPassword);
	if (!ok) return json({ error: 'Current password is wrong.' }, { status: 400 });
	return json({ ok: true });
}
