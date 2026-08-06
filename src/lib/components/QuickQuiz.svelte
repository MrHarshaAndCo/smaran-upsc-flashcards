<script>
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Stat from '$lib/components/Stat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { mulberry32 } from '$lib/data/demo.js';

	let {
		questions,
		quizId,
		emoji = '📝',
		title = 'Quick Quiz',
		perRound = 10
	} = $props();

	const letters = ['A', 'B', 'C', 'D'];
	const startedAt = Date.now();

	// Deterministic first round (seed = quizId) so SSR and client hydrate
	// identically; retake reseeds client-side.
	let roundSeed = $state(`${quizId}:0`);
	let round = $state(pickRound(roundSeed));
	let idx = $state(0);
	let results = $state([]);
	let done = $state(false);
	let posting = $state(false);
	let reveal = $state(false);
	let wrongPick = $state(null);
	let advancing = $state(false);
	let dx = $state(0);
	let dragging = $state(false);
	let startX = 0;

	const current = $derived(round[idx]);
	const correctCount = $derived(results.filter((r) => r.correct).length);
	const progressPct = $derived((results.length / round.length) * 100);

	let advanceTimer;

	function pickRound(seed) {
		let h = 2166136261;
		for (let i = 0; i < seed.length; i++) {
			h ^= seed.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		const rand = mulberry32(h >>> 0);
		const pool = [...questions];
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1));
			[pool[i], pool[j]] = [pool[j], pool[i]];
		}
		return pool.slice(0, Math.min(perRound, pool.length));
	}

	function notify(correct, optionText) {
		if (correct) {
			toast.success('Correct!', { description: 'Nice recall. On to the next.' });
		} else {
			toast.error('Not quite', { description: `The answer was: ${optionText}` });
		}
	}

	function answerByOption(i) {
		if (advancing || done) return;
		const q = current;
		const correct = i === q.correctIndex;
		results.push({ questionId: q.id, chosen: i, correct, ms: Date.now() - startedAt });
		if (!correct) wrongPick = i;
		reveal = true;
		notify(correct, q.options[q.correctIndex]);
		advance(correct ? 450 : 1600);
	}

	function answerBySwipe(knew) {
		if (advancing || done) return;
		const q = current;
		results.push({ questionId: q.id, chosen: null, correct: knew, ms: Date.now() - startedAt });
		wrongPick = null;
		reveal = true;
		notify(knew, q.options[q.correctIndex]);
		advance(knew ? 450 : 1600);
	}

	function advance(delay) {
		advancing = true;
		advanceTimer = setTimeout(() => {
			advancing = false;
			reveal = false;
			wrongPick = null;
			if (idx + 1 < round.length) {
				idx++;
			} else {
				finish();
			}
		}, delay);
	}

	async function finish() {
		done = true;
		posting = true;
		try {
			await fetch('/api/quiz', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					quizId,
					startedAt,
					endedAt: Date.now(),
					results: results.map((r) => ({ questionId: r.questionId, correct: r.correct, ms: r.ms }))
				})
			});
		} catch {
			// Best-effort
		}
		posting = false;
	}

	function restart() {
		roundSeed = `${quizId}:${Date.now()}`;
		round = pickRound(roundSeed);
		idx = 0;
		results = [];
		done = false;
		reveal = false;
		wrongPick = null;
		advancing = false;
		dx = 0;
	}

	function onPointerDown(e) {
		dragging = true;
		startX = e.clientX;
		dx = 0;
	}

	function onPointerMove(e) {
		if (!dragging) return;
		dx = e.clientX - startX;
	}

	function onPointerUp() {
		if (!dragging) return;
		dragging = false;
		const d = dx;
		dx = 0;
		if (d > 90) answerBySwipe(true);
		else if (d < -90) answerBySwipe(false);
	}

	function optionClass(i) {
		if (!reveal) return 'border-input bg-background hover:bg-muted active:scale-[0.99]';
		if (i === current.correctIndex) return 'border-green-500 bg-green-50 text-green-800';
		if (i === wrongPick) return 'border-red-500 bg-red-50 text-red-800';
		return 'border-input bg-background opacity-50';
	}
</script>

<div class="space-y-5">
	{#if done}
		<div class="space-y-4 pt-4 text-center">
			<h1 class="text-5xl font-bold tracking-tight">{Math.round((correctCount / round.length) * 100)}%</h1>
			<p class="text-muted-foreground">{correctCount} of {round.length} correct</p>
			<div class="grid grid-cols-2 gap-3">
				<Stat label="Correct" value={correctCount} />
				<Stat label="Missed" value={round.length - correctCount} />
			</div>
			<div class="flex flex-wrap justify-center gap-3 pt-2">
				<Button onclick={restart}>New round</Button>
				<Button variant="outline" onclick={() => goto('/quiz')}>All quizzes</Button>
				<Button variant="ghost" onclick={() => goto('/dashboard')}>Dashboard</Button>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm font-medium text-primary">{emoji} {title}</p>
				<p class="text-xs text-muted-foreground">{round.length} random questions · swipe or tap</p>
			</div>
			<div class="text-right">
				<p class="text-2xl font-bold">{correctCount}<span class="text-base font-normal text-muted-foreground">/{results.length}</span></p>
				<p class="text-xs text-muted-foreground">correct</p>
			</div>
		</div>
		<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<div class="h-full rounded-full bg-primary transition-all duration-300" style={`width: ${progressPct}%`} />
		</div>

		<Card
			class="touch-none select-none p-6"
			style={dragging ? `transform: translateX(${dx}px) rotate(${dx / 24}deg)` : 'transition: transform 200ms ease'}
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointerleave={onPointerUp}
			onpointercancel={onPointerUp}
		>
			<div class="mb-3 flex items-center justify-between text-xs text-muted-foreground">
				<span>{idx + 1} / {round.length}</span>
				<span class="rounded bg-muted px-2 py-0.5">{emoji}</span>
			</div>
			<h2 class="text-xl font-semibold leading-relaxed">{current.question}</h2>
			{#if reveal && wrongPick === null}
				<p class="mt-4 text-sm font-medium text-green-700">✓ {current.options[current.correctIndex]}</p>
			{/if}
		</Card>

		<div class="grid grid-cols-1 gap-2">
			{#each current.options as option, i (i)}
				<button
					onclick={() => answerByOption(i)}
					disabled={advancing || reveal}
					class={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-colors ${optionClass(i)} ${reveal && i === current.correctIndex ? 'animate-pulse' : ''}`}
				>
					<span class="font-mono text-xs opacity-60">{letters[i]}</span>
					<span>{option}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
