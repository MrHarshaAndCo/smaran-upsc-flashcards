/**
 * Smaran benchmark. Deterministic workload (fixed seed, no network) that
 * exercises the real review pipeline: spaced-repetition scheduling, memory
 * feedback, peer comparison, nemesis selection and taunts. Also measures
 * production SSR latency of the built app and the build size.
 *
 * Prints one `METRIC name=value` line per metric.
 */

import { spawn } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DECKS } from '../src/lib/data/content.js';
import { applyRating, initialCardState } from '../src/lib/engine/scheduler.js';
import { memoryFeedback, peerFeedback } from '../src/lib/engine/feedback.js';
import { selectNemesis, tauntFor } from '../src/lib/engine/nemesis.js';
import { mulberry32 } from '../src/lib/data/demo.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DAY_MS = 86_400_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* 1. Engine throughput                                                */
/* ------------------------------------------------------------------ */

function benchEngine() {
	const TOTAL = 200_000;
	const USERS = 100;
	const rand = mulberry32(20260806);
	const cards = DECKS.flatMap((d) => d.cards.map((c) => ({ ...c, deckId: d.id })));
	const ratings = ['again', 'hard', 'good', 'easy'];
	const weights = [0.15, 0.15, 0.5, 0.2];

	function pickRating() {
		const r = rand();
		let acc = 0;
		for (let i = 0; i < ratings.length; i++) {
			acc += weights[i];
			if (r < acc) return ratings[i];
		}
		return 'good';
	}

	const states = Array.from({ length: USERS }, () => new Map());
	const userStats = Array.from({ length: USERS }, () => ({ correct: 0, total: 0 }));
	const peerAcc = Array.from({ length: USERS }, () => new Map());
	const lastAt = new Map();

	const t0 = performance.now();
	for (let i = 0; i < TOTAL; i++) {
		const u = i % USERS;
		const card = cards[(i * 7 + 3) % cards.length];
		const rating = pickRating();
		const correct = rating !== 'again';

		const prev = states[u].get(card.id) ?? initialCardState();
		const next = applyRating(rating, prev);
		states[u].set(card.id, next);

		userStats[u].total++;
		if (correct) userStats[u].correct++;

		const ps = peerAcc[u].get(card.id) ?? { correctCount: 0, totalCount: 0 };
		ps.totalCount++;
		if (correct) ps.correctCount++;
		peerAcc[u].set(card.id, ps);

		const gapDays = lastAt.has(card.id)
			? Math.floor((Date.now() - lastAt.get(card.id)) / DAY_MS)
			: 0;
		lastAt.set(card.id, Date.now());

		memoryFeedback({
			rating,
			correct,
			state: next,
			prevState: prev,
			gapDays,
			reviewCount: next.reps + 1
		});
		peerFeedback({ correct, peers: ps, nemesis: peerAcc[(u + 7) % USERS].get(card.id) ?? null });

		if (i % 500 === 0) {
			const entries = userStats.map((s, ui) => ({
				userId: String(ui),
				name: `student${ui}`,
				accuracy: s.total ? s.correct / s.total : 0,
				reviews: s.total
			}));
			const nemesis = selectNemesis(String(u), entries);
			if (nemesis) {
				tauntFor({
					name: nemesis.name,
					record: { win: 1, loss: 0, draw: 0 },
					wonDecks: 1,
					lostDecks: 0,
					userStreak: 3,
					lastDeckTitle: 'Indian Polity'
				});
			}
		}
	}
	const dt = (performance.now() - t0) / 1000;
	return { rate: TOTAL / dt, total: TOTAL };
}

/* ------------------------------------------------------------------ */
/* 2. SSR latency of the built app                                     */
/* ------------------------------------------------------------------ */

async function measureSsr() {
	const server = spawn(process.execPath, ['build/index.js'], {
		cwd: ROOT,
		env: { ...process.env, PORT: '4299', HOST: '127.0.0.1', DATABASE_URL: '' },
		stdio: 'ignore'
	});
	const base = 'http://127.0.0.1:4299';
	try {
		let ready = false;
		for (let i = 0; i < 100 && !ready; i++) {
			try {
				const r = await fetch(base + '/');
				if (r.ok) ready = true;
			} catch {
				await sleep(100);
			}
		}
		if (!ready) throw new Error('SSR server did not become ready');

		const times = [];
		for (let i = 0; i < 10; i++) {
			const t0 = performance.now();
			const r = await fetch(base + '/');
			await r.text();
			times.push(performance.now() - t0);
		}
		times.sort((a, b) => a - b);
		return times[Math.floor(times.length / 2)];
	} finally {
		server.kill('SIGTERM');
	}
}

/* ------------------------------------------------------------------ */
/* 3. Build size                                                       */
/* ------------------------------------------------------------------ */

function dirSize(p) {
	if (!existsSync(p)) return 0;
	let total = 0;
	for (const e of readdirSync(p, { withFileTypes: true })) {
		const fp = join(p, e.name);
		total += e.isDirectory() ? dirSize(fp) : statSync(fp).size;
	}
	return total;
}

/* ------------------------------------------------------------------ */

const { rate } = benchEngine();
console.log(`METRIC reviews_per_sec=${rate.toFixed(1)}`);

const ssrMs = await measureSsr();
console.log(`METRIC ssr_ttfb_ms=${ssrMs.toFixed(1)}`);

const buildKb = (dirSize(join(ROOT, 'build')) + dirSize(join(ROOT, '.svelte-kit', 'output'))) / 1024;
console.log(`METRIC build_kb=${buildKb.toFixed(1)}`);
