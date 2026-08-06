<script>
	import { goto } from '$app/navigation';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import NameForm from '$lib/components/NameForm.svelte';
	import { applyRating, initialCardState, DAY_MS } from '$lib/engine/scheduler.js';
	import { memoryFeedback, peerFeedback, sessionAdvice } from '$lib/engine/feedback.js';
	import { h2hRecord } from '$lib/engine/nemesis.js';
	import { mulberry32 } from '$lib/data/demo.js';

	let { data } = $props();

	function seededShuffle(cards, seedStr) {
		let h = 2166136261;
		for (let i = 0; i < seedStr.length; i++) {
			h ^= seedStr.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		const rand = mulberry32(h >>> 0);
		const a = [...cards];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	// svelte-ignore state_referenced_locally — route params are static for this page
	const deckId = data.deck.id;
	// svelte-ignore state_referenced_locally — queue is a one-time seeded shuffle
	let queue = $state(seededShuffle(data.cards, deckId));
	let idx = $state(0);
	let flipped = $state(false);
	let rated = $state(false);
	let feedbacks = $state([]);
	let results = $state([]);
	let requeue = $state([]);
	let repass = $state(false);
	let done = $state(false);
	let posting = $state(false);
	// svelte-ignore state_referenced_locally — server state snapshot at session start
	let states = $state(new Map(Object.entries(data.cardStates).map(([k, v]) => [k, { ...v }])));
	let summary = $state(null);
	let cardShownAt = Date.now();
	const startedAt = Date.now();

	const current = $derived(queue[idx]);
	const answered = $derived(results.length);
	const totalInPass = $derived(queue.length);

	function rate(rating) {
		if (!current || rated) return;
		const ms = Date.now() - cardShownAt;
		const prev = states.get(current.id) ?? initialCardState();
		const nextState = applyRating(rating, prev);
		states.set(current.id, nextState);
		results.push({ cardId: current.id, rating, ms });
		const correct = rating !== 'again';
		if (!correct) requeue.push(current.id);

		const meta = data.myMeta?.[current.id] ?? { reviewCount: 0, lastAt: 0 };
		const gapDays = meta.lastAt ? Math.max(0, Math.round((Date.now() - meta.lastAt) / DAY_MS)) : 0;
		const memory = memoryFeedback({
			rating,
			correct,
			state: nextState,
			prevState: meta.lastAt ? prev : null,
			gapDays,
			reviewCount: meta.reviewCount + 1
		});
		const items = [memory];
		const peer = peerFeedback({
			correct,
			peers: data.peerStats?.[current.id] ?? null,
			nemesis: data.nemesisStats?.[current.id] ?? null
		});
		if (peer) items.push(peer);
		feedbacks = items;
		rated = true;
		cardShownAt = Date.now();
	}

	function next() {
		if (idx + 1 < queue.length) {
			idx++;
			flipped = false;
			rated = false;
			feedbacks = [];
			cardShownAt = Date.now();
		} else if (requeue.length > 0) {
			queue = requeue;
			requeue = [];
			idx = 0;
			repass = true;
			flipped = false;
			rated = false;
			feedbacks = [];
			cardShownAt = Date.now();
		} else {
			finish();
		}
	}

	async function finish() {
		done = true;
		const endedAt = Date.now();
		const total = results.length;
		const correct = results.filter((r) => r.rating !== 'again').length;
		const lapses = results.filter((r) => r.rating === 'again').length;
		const missedCards = new Set(results.filter((r) => r.rating === 'again').map((r) => r.cardId)).size;
		let dueTomorrow = 0;
		for (const st of states.values()) if (st.due <= Date.now() + DAY_MS) dueTomorrow++;
		const advice = sessionAdvice({ correct, total, lapses, missedCards, dueTomorrow });

		let nemesisNote = null;
		if (data.nemesisStats && data.nemesisName) {
			let nc = 0;
			let nt = 0;
			for (const s of Object.values(data.nemesisStats)) {
				nc += s.correctCount;
				nt += s.totalCount;
			}
			const r = h2hRecord({ myCorrect: correct, myTotal: total, theirCorrect: nc, theirTotal: nt });
			nemesisNote =
				r.outcome === 'win'
					? `You beat ${data.nemesisName} this session — ${Math.round(r.myRate * 100)}% vs their ${Math.round(r.theirRate * 100)}%.`
					: r.outcome === 'loss'
						? `${data.nemesisName} still owns this deck — their ${Math.round(r.theirRate * 100)}% beats your ${Math.round(r.myRate * 100)}%. Next pass fixes that.`
						: `Dead even with ${data.nemesisName} this time. The next session decides.`;
		}

		summary = { total, correct, lapses, missedCards, advice, nemesisNote };

		if (data.userId) {
			posting = true;
			try {
				await fetch('/api/sessions', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ deckId, startedAt, endedAt, results })
				});
			} catch {
				// Session still counts on screen; the record is best-effort here.
			}
			posting = false;
		}
	}

	function restart() {
		queue = seededShuffle(data.cards, deckId);
		idx = 0;
		flipped = false;
		rated = false;
		feedbacks = [];
		results = [];
		requeue = [];
		repass = false;
		done = false;
		summary = null;
		states = new Map();
		cardShownAt = Date.now();
	}

	$effect(() => {
		function onKey(e) {
			if (done) return;
			if (e.key === ' ' || e.key === 'Enter') {
				if (!flipped) {
					e.preventDefault();
					flipped = true;
				}
			} else if (flipped && !rated) {
				const map = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
				if (map[e.key]) rate(map[e.key]);
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div class="wrap" style="padding-top: 32px; max-width: 760px">
	{#if !data.user}
		<div class="gate">
			<p class="eyebrow">{data.deck.emoji} {data.deck.title}</p>
			<h1>Enter your name to study</h1>
			<p class="muted">
				Your reviews get scheduled, scored against peers, and counted against your rival.
				No password — just a name on the board.
			</p>
			<div style="margin-top: 20px; display: flex; justify-content: center">
				<NameForm />
			</div>
		</div>
	{:else if data.cards.length === 0}
		<div class="empty">
			<h2>This deck has no cards yet</h2>
			<p>Come back later — the set is still being written.</p>
		</div>
	{:else if done}
		<div class="card" style="padding: 30px">
			<p class="eyebrow">Session report</p>
			<h1 style="font-size: 2.6rem">
				{Math.round((summary.correct / Math.max(summary.total, 1)) * 100)}%
				<span class="muted" style="font-size: 1.2rem; font-weight: 600"> — {summary.correct}/{summary.total} correct</span>
			</h1>
			<div class="stat-row" style="margin-top: 16px">
				<div class="stat"><div class="label">Lapses</div><div class="value">{summary.lapses}</div></div>
				<div class="stat"><div class="label">Cards missed</div><div class="value">{summary.missedCards}</div></div>
				<div class="stat"><div class="label">Re-pass</div><div class="value">{repass ? 'Done' : 'None needed'}</div></div>
			</div>

			<hr class="hr" />
			<div class="feedback {summary.advice.tone}">
				<div class="fb-title">{summary.advice.title}</div>
				<div class="fb-body">{summary.advice.body}</div>
			</div>
			{#if summary.nemesisNote}
				<div class="feedback neutral" style="margin-top: 10px">
					<div class="fb-title">Rival report</div>
					<div class="fb-body">{summary.nemesisNote}</div>
				</div>
			{/if}

			<div style="display: flex; gap: 10px; margin-top: 22px; flex-wrap: wrap">
				<button class="btn btn-primary" onclick={restart} disabled={posting}>Study again</button>
				<button class="btn btn-ghost" onclick={() => goto('/dashboard')} disabled={posting}>View dashboard</button>
			</div>
			{#if posting}<p class="small muted" style="margin-top: 10px">Recording session…</p>{/if}
		</div>
	{:else}
		<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px">
			<p class="eyebrow">{data.deck.emoji} {data.deck.title} · {data.user.name}</p>
			<p class="mono" style="color: var(--slate)">Card {answered + 1} of {totalInPass}{repass ? ' (re-test)' : ''}</p>
		</div>
		<div class="bar" style="margin-bottom: 18px"><i style="width: {Math.min(100, (answered / Math.max(totalInPass, 1)) * 100)}%"></i></div>

		{#key current.id}
			<Flashcard card={current} bind:flipped />
		{/key}

		{#if rated}
			<div style="margin-top: 18px">
				<FeedbackPanel items={feedbacks} />
				<button class="btn btn-dark btn-block" style="margin-top: 14px" onclick={next}>Next card</button>
			</div>
		{:else}
			<div class="rate-row" style="margin-top: 18px">
				<button class="rate-btn again" disabled={!flipped} onclick={() => rate('again')}>1 · Again</button>
				<button class="rate-btn hard" disabled={!flipped} onclick={() => rate('hard')}>2 · Hard</button>
				<button class="rate-btn good" disabled={!flipped} onclick={() => rate('good')}>3 · Good</button>
				<button class="rate-btn easy" disabled={!flipped} onclick={() => rate('easy')}>4 · Easy</button>
			</div>
			<p class="small muted" style="margin-top: 10px; text-align: center">
				Click the card or press space to flip · rate with 1–4
			</p>
		{/if}
	{/if}
</div>
