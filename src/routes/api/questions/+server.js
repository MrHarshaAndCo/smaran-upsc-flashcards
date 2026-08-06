import { json } from '@sveltejs/kit';
import { getStore } from '$lib/data/store.js';

export async function GET({ url }) {
	const store = await getStore();
	const questions = await store.getQuestions({
		subject: url.searchParams.get('subject'),
		subTopic: url.searchParams.get('subTopic'),
		limit: Number(url.searchParams.get('limit') ?? 10)
	});
	return json({ questions });
}
