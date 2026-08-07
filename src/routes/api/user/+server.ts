import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function POST({ request, cookies }) {
	const isHttps = request.headers.get("x-forwarded-proto") === "https";
	const { name } = await request.json();
	if (!name || !name.trim()) {
		return json({ error: 'name required' }, { status: 400 });
	}
	const store = await getStore();
	const user = await store.createUser(name);
	cookies.set('smaran_u', user.id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: isHttps,
		maxAge: 60 * 60 * 24 * 365
	});
	return json({ user });
}
