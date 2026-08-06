import { json } from '@sveltejs/kit';
import { requestCoach } from '$lib/engine/aiCoach.js';

export async function POST({ request }) {
	const body = await request.json().catch(() => ({}));
	const { score = 0, total = 0, name = 'Aspirant', items = [] } = body;
	if (!Array.isArray(items)) {
		return json({ error: 'items must be an array' }, { status: 400 });
	}
	const result = await requestCoach({
		name,
		score: Number(score),
		total: Number(total),
		items,
		apiKey: process.env.DEEPSEEK_API_KEY,
		model: process.env.DEEPSEEK_MODEL
	});
	return json(result);
}
