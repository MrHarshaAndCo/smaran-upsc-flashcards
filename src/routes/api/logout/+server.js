import { json } from '@sveltejs/kit';

export async function POST({ cookies }) {
	cookies.delete('smaran_u', { path: '/' });
	return json({ ok: true });
}
