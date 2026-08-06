import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function POST({ request, cookies }) {
	const userId = cookies.get('smaran_u');
	if (!userId) {
		return json({ error: 'no user' }, { status: 401 });
	}
	const body = await request.json();
	const { deckId, startedAt, endedAt, results } = body;
	if (!deckId || !Array.isArray(results) || results.length === 0) {
		return json({ error: 'invalid session' }, { status: 400 });
	}
	const store = await getStore();
	const id = await store.saveSession({ userId, deckId, startedAt, endedAt, results });
	return json({ id });
}
