import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';
import { isValidEmail } from '$lib/auth.js';

export async function POST({ request, cookies }) {
	const isHttps = request.headers.get("x-forwarded-proto") === "https";
	const { name, email, password } = await request.json().catch(() => ({}));
	if (!name || !name.trim()) {
		return json({ error: 'Name is required.' }, { status: 400 });
	}
	if (!isValidEmail(email)) {
		return json({ error: 'A valid email is required.' }, { status: 400 });
	}
	if (!password || password.length < 6) {
		return json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
	}
	const store = await getStore();
	const existing = await store.findUserByEmail(email);
	if (existing) {
		return json({ error: 'An account with this email already exists. Log in instead.' }, { status: 409 });
	}
	const user = await store.createUser(name, { email, password });
	cookies.set('smaran_u', user.id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: isHttps,
		maxAge: 60 * 60 * 24 * 365
	});
	return json({ user });
}
