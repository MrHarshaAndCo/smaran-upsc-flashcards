import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

/**
 * Register a device against the signed-in user. `deviceId` is whatever the
 * tester's phone reports (PWA install token, Expo/Android id, etc.).
 */
export async function POST({ request, cookies }) {
	const userId = cookies.get('smaran_u');
	if (!userId) {
		return json({ error: 'no user' }, { status: 401 });
	}
	const body = await request.json();
	const deviceId = typeof body.deviceId === 'string' ? body.deviceId.trim() : '';
	const platform = typeof body.platform === 'string' ? body.platform.slice(0, 40) : 'web';
	if (!deviceId || deviceId.length > 200) {
		return json({ error: 'a device id is required (max 200 chars)' }, { status: 400 });
	}
	const store = await getStore();
	const device = await store.addDevice({ deviceId, userId, platform });
	return json({ device });
}
