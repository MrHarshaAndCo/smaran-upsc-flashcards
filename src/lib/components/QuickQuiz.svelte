<script>
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Stat from '$lib/components/Stat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { seededShuffle } from '$lib/engine/shuffle.js';
	import { missToast, nemesisVerdict } from '$lib/engine/nemesisToast.js';

	let {
		questions, quizId, emoji = '📝', title = 'Quick Quiz', perRound = 10,
		nemesisStats = null, nemesisName = null, nemesisUserId = null, userName = 'Aspirant'
	} = $props();

	const letters = ['A', 'B', 'C', 'D'];
	const startedAt = Date.now();

	let roundSeed = $state(`${quizId}:0`);
	let round = $state(pickRound(roundSeed));
	let idx = $state(0);
	let results = $state([]);
	let misses = $state(new Map());
	let done = $state(false);
	let posting = $state(false);
	let reveal = $state(false);
	let wrongPick = $state(null);
	let advancing = $state(false);

	const current = $derived(round[idx]);
	const correctCount = $derived(results.filter((r) => r.correct).length);
	const progressPct = $derived((results.length / round.length) * 100);

	function pickRound(seed) { return seededShuffle(questions, seed).slice(0, Math.min(perRound, questions.length)); }
	function nemesisRateFor(id) { const s = nemesisStats?.[id]; return s && s.totalCount > 0 ? s.correctCount / s.totalCount : null; }

	function notifyMiss(q) {
		const count = (misses.get(q.id) ?? 0) + 1;
		misses.set(q.id, count);
		const data = missToast({ missCount: count, nemesisRate: nemesisRateFor(q.id), nemesisName: nemesisName ?? 'your rival', correctText: q.options[q.correctIndex] });
		if (data.tone === 'error') toast.error(data.title, { description: data.body });
		else toast.warning(data.title, { description: data.body });
	}

	function answerByOption(i) {
		if (advancing || done) return;
		const q = current;
		const correct = i === q.correctIndex;
		results.push({ questionId: q.id, chosen: i, correct, ms: Date.now() - startedAt });
		if (!correct) wrongPick = i;
		reveal = true;
		if (correct) toast.success('Correct!', { description: 'Nice recall. On to the next.' });
		else notifyMiss(q);
		advance(correct ? 450 : 1600);
	}

	function revealAnswer() {
		if (advancing || done) return;
		const q = current;
		results.push({ questionId: q.id, chosen: null, correct: false, ms: Date.now() - startedAt });
		wrongPick = null; reveal = true;
		notifyMiss(q);
		advance(1600);
	}

	function advance(delay) {
		advancing = true;
		setTimeout(() => { advancing = false; reveal = false; wrongPick = null; if (idx + 1 < round.length) idx++; else finish(); }, delay);
	}

	async function finish() {
		done = true; posting = true;
		const correct = results.filter(r => r.correct).length;
		const total = results.length;

		let nemesisPayload = undefined;
		if (nemesisUserId) {
			let nc = 0, nt = 0;
			if (nemesisStats) for (const s of Object.values(nemesisStats)) { nc += s.correctCount; nt += s.totalCount; }
			if (nt > 0 && total > 0) {
				const myRate = correct / total, theirRate = nc / nt;
				nemesisPayload = { nemesisUserId, myCorrect: correct, myTotal: total, theirCorrect: nc, theirTotal: nt, outcome: myRate > theirRate ? 'win' : myRate < theirRate ? 'loss' : 'draw' };
			}
		}
		try {
			await fetch('/api/quiz', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ quizId, startedAt, endedAt: Date.now(), results: results.map(r => ({ questionId: r.questionId, correct: r.correct, ms: r.ms })), nemesis: nemesisPayload }) });
		} catch {}
		// Local nemesis verdict — computed from the actual duel data, no API call.
		if (nemesisPayload && nemesisName) {
			const v = nemesisVerdict({ nemesisName, myScore: correct, myTotal: total, theirScore: +(nemesisPayload.theirCorrect), theirTotal: +(nemesisPayload.theirTotal), record: null });
			toast(v.title, { description: v.body, duration: 8000 });
		}
		posting = false;
	}

	function restart() {
		roundSeed = `${quizId}:${Date.now()}`;
		round = pickRound(roundSeed); idx = 0; results = []; misses = new Map(); done = false; reveal = false; wrongPick = null; advancing = false;
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
			<h1 class="font-display text-6xl font-semibold tracking-tight">{Math.round((correctCount / round.length) * 100)}%</h1>
			<p class="text-muted-foreground">{correctCount} of {round.length} correct</p>
			<div class="grid grid-cols-2 gap-3"><Stat label="Correct" value={correctCount} /><Stat label="Missed" value={round.length - correctCount} /></div>
			<div class="flex flex-wrap justify-center gap-3 pt-2"><Button onclick={restart}>New round</Button><Button variant="outline" onclick={() => goto('/quiz')}>All quizzes</Button><Button variant="ghost" onclick={() => goto('/dashboard')}>Dashboard</Button></div>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<div><p class="font-mono text-xs font-medium text-primary">{emoji} {title}</p><p class="text-xs text-muted-foreground">{round.length} random questions · tap to answer</p></div>
			<div class="text-right"><p class="font-mono text-2xl font-semibold tracking-tight">{correctCount}<span class="text-base font-normal text-muted-foreground">/{results.length}</span></p><p class="text-xs text-muted-foreground">correct</p></div>
		</div>
		<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-primary transition-all duration-300" style={`width: ${progressPct}%`} /></div>

		<Card class="p-6">
			<div class="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span class="font-mono">{idx + 1} / {round.length}</span><span class="rounded bg-muted px-2 py-0.5 font-mono">{emoji}{#if current.sourceQuiz} · {current.sourceQuiz}{/if}</span></div>
			<h2 class="text-xl font-semibold leading-relaxed">{current.question}</h2>
			{#if reveal && wrongPick === null}<p class="mt-4 text-sm font-medium text-green-700">✓ {current.options[current.correctIndex]}</p>{/if}
		</Card>

		<div class="grid grid-cols-1 gap-2">
			{#each current.options as option, i (i)}
				<button onclick={() => answerByOption(i)} disabled={advancing || reveal} class={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-colors ${optionClass(i)} ${reveal && i === current.correctIndex ? 'animate-pulse' : ''}`}><span class="font-mono text-xs opacity-60">{letters[i]}</span><span>{option}</span></button>
			{/each}
			{#if !reveal}
				<button onclick={revealAnswer} disabled={advancing} class="flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted">I don't know — reveal it</button>
			{/if}
		</div>
	{/if}
</div>
