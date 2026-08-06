/**
 * Import real UPSC Prelims questions from Hugging Face into Neon.
 *
 * Source: https://huggingface.co/datasets/sid-th26/prelims_question (9,999 rows)
 * Reads via the datasets-server JSON API (no auth), skips Hindi (Devanagari)
 * questions, normalizes into the `questions` table, dedupes by question hash.
 *
 * Run: node scripts/import-questions.mjs
 */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const env = Object.fromEntries(
	readFileSync(new URL('../.env', import.meta.url), 'utf8')
		.split('\n')
		.filter((l) => l && !l.startsWith('#'))
		.map((l) => {
			const i = l.indexOf('=');
			return [l.slice(0, i), l.slice(i + 1)];
		})
);

if (!env.DATABASE_URL) {
	console.error('DATABASE_URL missing in .env');
	process.exit(1);
}

const sql = neon(env.DATABASE_URL);

await sql(
	`CREATE TABLE IF NOT EXISTS questions (
	  id text primary key, subject text not null, sub_topic text,
	  question text not null, options jsonb not null, answer_index int not null,
	  explanation text, created_at bigint not null default 0
	)`
);
await sql('CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions (subject)');
await sql('CREATE INDEX IF NOT EXISTS idx_questions_subtopic ON questions (sub_topic)');

const API = 'https://datasets-server.huggingface.co/rows?dataset=sid-th26/prelims_question&config=default&split=train&offset=';

const ANSWER_MAP = { a: 0, b: 1, c: 2, d: 3 };
const HINDI = /[\u0900-\u097F]/;

/** @param {any} row @returns {object|null} normalized question */
function normalize(row) {
	const q = String(row.Question ?? '').trim();
	if (!q || HINDI.test(q)) return null;
	const options = [row.Option_A, row.Option_B, row.Option_C, row.Option_D].map((o) =>
		String(o ?? '').trim()
	);
	if (options.some((o) => !o)) return null;
	const answerIndex = ANSWER_MAP[String(row.Answer ?? '').trim().toLowerCase()];
	if (answerIndex === undefined) return null;
	return {
		id: createHash('sha1').update(q).digest('hex'),
		subject: String(row.Subject ?? 'General Studies').trim().slice(0, 80),
		sub_topic: String(row.Topic ?? '').trim().slice(0, 120) || null,
		question: q,
		options: JSON.stringify(options),
		answer_index: answerIndex,
		explanation: String(row.Explaination ?? '').trim().slice(0, 2000) || null
	};
}

const TOTAL = 9999;
const PAGE = 100;
let imported = 0;
let skipped = 0;
let batch = [];
const seen = new Set();

async function fetchPage(offset) {
	for (let attempt = 1; attempt <= 5; attempt++) {
		const res = await fetch(`${API}${offset}&length=${PAGE}`);
		if (res.ok) return res.json();
		if (res.status === 429) {
			const wait = 2000 * attempt;
			console.log(`rate limited at ${offset} — waiting ${wait / 1000}s (attempt ${attempt})`);
			await new Promise((r) => setTimeout(r, wait));
			continue;
		}
		throw new Error(`page ${offset}: HTTP ${res.status}`);
	}
	throw new Error(`page ${offset}: still rate limited`);
}

for (let offset = 0; offset < TOTAL; offset += PAGE) {
	const j = await fetchPage(offset);
	for (const r of j.rows ?? []) {
		const q = normalize(r.row);
		if (!q) {
			skipped++;
			continue;
		}
		if (seen.has(q.id)) {
			skipped++;
			continue;
		}
		seen.add(q.id);
		batch.push(q);
		imported++;
		if (batch.length >= 500) {
			await flush(batch);
			batch = [];
		}
	}
	if (offset % 1000 === 0) console.log(`offset ${offset}/${TOTAL} — imported ${imported}, skipped ${skipped}`);
}
if (batch.length) await flush(batch);

async function flush(rows) {
	const values = rows
		.map((q) => {
			const esc = (s) => (s === null ? 'NULL' : `'${s.replaceAll("'", "''")}'`);
			return `(${esc(q.id)},${esc(q.subject)},${esc(q.sub_topic)},${esc(q.question)},${esc(q.options)},${q.answer_index},${esc(q.explanation)})`;
		})
		.join(',');
	await sql(
		`INSERT INTO questions (id, subject, sub_topic, question, options, answer_index, explanation)
		 VALUES ${values} ON CONFLICT (id) DO NOTHING`
	);
}

const counts = await sql(
	'SELECT count(*)::int n, count(DISTINCT subject) subjects FROM questions'
);
console.log(`\nDone. imported ${imported} (skipped ${skipped} — hindi/invalid/dup).`);
console.log(`questions table: ${counts[0].n} rows across ${counts[0].subjects} subjects.`);
