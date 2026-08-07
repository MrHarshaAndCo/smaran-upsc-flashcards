import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function POST({ request, cookies }) {
	const isHttps = request.headers.get("x-forwarded-proto") === "https";
	const { email, password } = await request.json().catch(() => ({}));
	const store = await getStore();
	const user = await store.verifyCredentials(email, password);
	if (!user) {
		return json({ error: 'Wrong email or password.' }, { status: 401 });
	}
	cookies.set('smaran_u', user.id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: isHttps,
		maxAge: 60 * 60 * 24 * 365
	});
	return json({ user, cookieSecure: isHttps });
}
