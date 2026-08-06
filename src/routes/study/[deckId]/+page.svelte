<script>
	import { goto } from '$app/navigation';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
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

	const deckId = data.deck.id;
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
				// Best-effort
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

<div class="mx-auto max-w-2xl space-y-6 pt-8">
	{#if data.cards.length === 0}
		<p class="py-16 text-center text-muted-foreground">This deck has no cards yet. Come back later.</p>
	{:else if done}
		<div class="space-y-4">
			<p class="text-sm font-medium text-primary">Session report</p>
			<h1 class="text-4xl font-bold tracking-tight">
				{Math.round((summary.correct / Math.max(summary.total, 1)) * 100)}%
				<span class="text-lg font-medium text-muted-foreground"> — {summary.correct}/{summary.total} correct</span>
			</h1>
			<div class="grid grid-cols-3 gap-3">
				<Card class="p-4"><p class="text-xs text-muted-foreground">Lapses</p><p class="text-2xl font-bold">{summary.lapses}</p></Card>
				<Card class="p-4"><p class="text-xs text-muted-foreground">Missed</p><p class="text-2xl font-bold">{summary.missedCards}</p></Card>
				<Card class="p-4"><p class="text-xs text-muted-foreground">Re-pass</p><p class="text-2xl font-bold">{repass ? 'Done' : 'None'}</p></Card>
			</div>
			<FeedbackPanel items={[summary.advice]} />
			{#if summary.nemesisNote}
				<FeedbackPanel items={[{ tone: 'neutral', title: 'Rival report', body: summary.nemesisNote }]} />
			{/if}
			<div class="flex flex-wrap gap-3 pt-2">
				<Button onclick={restart} disabled={posting}>Study again</Button>
				<Button variant="outline" onclick={() => goto('/dashboard')} disabled={posting}>View dashboard</Button>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<p class="text-sm font-medium text-primary">{data.deck.emoji} {data.deck.title}</p>
			<p class="text-sm text-muted-foreground">
				Card {answered + 1} / {totalInPass}{repass ? ' · re-test' : ''}
			</p>
		</div>
		<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<div class="h-full rounded-full bg-primary transition-all" style={`width: ${Math.min(100, (answered / Math.max(totalInPass, 1)) * 100)}%`} />
		</div>

		{#key current.id}
			<Flashcard card={current} {deck} bind:flipped />
		{/key}

		{#if rated}
			<div class="space-y-4">
				<FeedbackPanel items={feedbacks} />
				<Button class="w-full" size="lg" onclick={next}>Next card</Button>
			</div>
		{:else}
			<div class="grid grid-cols-4 gap-2">
				<Button variant="destructive" class="h-14" disabled={!flipped} onclick={() => rate('again')}>Again</Button>
				<Button variant="secondary" class="h-14" disabled={!flipped} onclick={() => rate('hard')}>Hard</Button>
				<Button variant="default" class="h-14" disabled={!flipped} onclick={() => rate('good')}>Good</Button>
				<Button variant="outline" class="h-14" disabled={!flipped} onclick={() => rate('easy')}>Easy</Button>
			</div>
			<p class="text-center text-xs text-muted-foreground">Space to flip · 1–4 to rate</p>
		{/if}
	{/if}
</div>
