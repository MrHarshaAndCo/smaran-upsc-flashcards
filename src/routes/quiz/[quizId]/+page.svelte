<script>
	import { goto } from '$app/navigation';
	import { PenLine } from 'lucide-svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { peerFeedback } from '$lib/engine/feedback.js';
	import { h2hRecord } from '$lib/engine/nemesis.js';

	let { data } = $props();

	const questions = data.quiz.questions;
	let idx = $state(0);
	let selected = $state(null);
	let answered = $state(false);
	let feedback = $state(null);
	let results = $state([]);
	let done = $state(false);
	let posting = $state(false);
	let summary = $state(null);
	let cardShownAt = Date.now();
	const startedAt = Date.now();

	const current = $derived(questions[idx]);
	const letters = ['A', 'B', 'C', 'D'];

	function choose(i) {
		if (answered) return;
		selected = i;
	}

	function check() {
		if (selected === null || answered) return;
		const q = current;
		const correct = selected === q.correctIndex;
		results.push({ questionId: q.id, chosen: selected, correct, ms: Date.now() - cardShownAt });

		const items = [
			{ tone: correct ? 'good' : 'bad', title: correct ? 'Correct' : 'Not quite', body: q.explanation }
		];
		const peer = peerFeedback({
			correct,
			peers: data.peerStats?.[q.id] ?? null,
			nemesis: data.nemesisStats?.[q.id] ?? null
		});
		if (peer) items.push(peer);
		feedback = items;
		answered = true;
		cardShownAt = Date.now();
	}

	function next() {
		if (idx + 1 < questions.length) {
			idx++;
			selected = null;
			answered = false;
			feedback = null;
			cardShownAt = Date.now();
		} else {
			finish();
		}
	}

	async function finish() {
		done = true;
		const correct = results.filter((r) => r.correct).length;
		const total = results.length;

		let rivalNote = null;
		if (data.nemesisStats && data.nemesisName) {
			let nc = 0;
			let nt = 0;
			for (const s of Object.values(data.nemesisStats)) {
				nc += s.correctCount;
				nt += s.totalCount;
			}
			const r = h2hRecord({ myCorrect: correct, myTotal: total, theirCorrect: nc, theirTotal: nt });
			rivalNote =
				r.outcome === 'win'
					? `You beat ${data.nemesisName} on this quiz — ${Math.round(r.myRate * 100)}% vs their ${Math.round(r.theirRate * 100)}%.`
					: r.outcome === 'loss'
						? `${data.nemesisName} scored better on this quiz — their ${Math.round(r.theirRate * 100)}% beats your ${Math.round(r.myRate * 100)}%. Rematch.`
						: `Dead even with ${data.nemesisName} on this quiz. The next one decides.`;
		}

		const rate = total === 0 ? 0 : correct / total;
		const advice =
			rate >= 0.9
				? { tone: 'good', title: 'Examination form', body: `${Math.round(rate * 100)}% — a serious score. The misses below are all that matter now.` }
				: rate >= 0.6
					? { tone: 'neutral', title: 'Solid, with seams', body: `${Math.round(rate * 100)}% correct. Review the missed questions below — they are your real syllabus.` }
					: { tone: 'bad', title: 'Rough pass', body: `${Math.round(rate * 100)}% — below your standard. Go through every miss, then retake tomorrow.` };

		summary = { correct, total, advice, rivalNote };

		if (data.userId) {
			posting = true;
			try {
				await fetch('/api/quiz', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ quizId: data.quiz.id, startedAt, endedAt: Date.now(), results })
				});
			} catch {
				// Best-effort
			}
			posting = false;
		}
	}

	function restart() {
		idx = 0;
		selected = null;
		answered = false;
		feedback = null;
		results = [];
		done = false;
		summary = null;
		cardShownAt = Date.now();
	}

	function optionVariant(i) {
		if (!answered) return selected === i ? 'secondary' : 'outline';
		if (i === current.correctIndex) return 'success';
		if (i === selected) return 'destructive';
		return 'outline';
	}

	$effect(() => {
		function onKey(e) {
			if (done) return;
			const n = parseInt(e.key, 10);
			if (!answered && n >= 1 && n <= questions.length) {
				selected = n - 1;
			} else if (!answered && selected !== null && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				check();
			} else if (answered && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				next();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div class="mx-auto max-w-2xl space-y-6 pt-8">
	{#if done}
		<div class="space-y-4">
			<p class="text-sm font-medium text-primary">{data.quiz.emoji} {data.quiz.title} · report</p>
			<h1 class="text-4xl font-bold tracking-tight">
				{Math.round((summary.correct / Math.max(summary.total, 1)) * 100)}%
				<span class="text-lg font-medium text-muted-foreground"> — {summary.correct}/{summary.total} correct</span>
			</h1>
			<FeedbackPanel items={[summary.advice]} />
			{#if summary.rivalNote}
				<FeedbackPanel items={[{ tone: 'neutral', title: 'Rival report', body: summary.rivalNote }]} />
			{/if}

			<div class="rounded-lg border divide-y">
				{#each questions as q, i (q.id)}
					{@const r = results[i]}
					{#if r}
						<div class="flex gap-3 p-4">
							<span class={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${r.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
								{r.correct ? '✓' : '✗'}
							</span>
							<div>
								<p class="text-sm font-medium">{i + 1}. {q.question}</p>
								<p class="mt-1 text-xs text-muted-foreground">
									Your answer: <span class="font-medium text-foreground">{letters[r.chosen]}. {q.options[r.chosen]}</span>
									{#if !r.correct}
										· correct: <span class="font-medium text-green-600">{letters[q.correctIndex]}. {q.options[q.correctIndex]}</span>
									{/if}
								</p>
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<div class="flex flex-wrap gap-3 pt-2">
				<Button onclick={restart} disabled={posting}>Retake quiz</Button>
				<Button variant="outline" onclick={() => goto('/quiz')} disabled={posting}>All quizzes</Button>
				<Button variant="ghost" onclick={() => goto('/dashboard')} disabled={posting}>Dashboard</Button>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<p class="text-sm font-medium text-primary">{data.quiz.emoji} {data.quiz.title}</p>
			<p class="text-sm text-muted-foreground">Q {idx + 1} / {questions.length}</p>
		</div>
		<Progress value={idx} max={questions.length} />

		<Card>
			<CardHeader>
				<div class="flex items-start gap-2">
					<PenLine class="mt-1 size-4 shrink-0 text-primary" />
					<CardTitle class="text-xl leading-relaxed">{current.question}</CardTitle>
				</div>
			</CardHeader>
			<CardContent class="flex flex-col gap-2.5">
				{#each current.options as option, i (i)}
					<Button
						variant={optionVariant(i)}
						size="lg"
						class="h-auto w-full justify-start py-3.5 text-left"
						disabled={answered}
						onclick={() => choose(i)}
					>
						<span class="mr-2 font-mono text-sm opacity-70">{letters[i]}</span>
						<span class="whitespace-normal">{option}</span>
					</Button>
				{/each}
			</CardContent>
		</Card>

		{#if answered}
			<div class="space-y-4">
				<FeedbackPanel items={feedback} />
				<Button class="w-full" size="lg" onclick={next}>
					{idx + 1 < questions.length ? 'Next question' : 'See results'}
				</Button>
			</div>
		{:else}
			<Button class="w-full" size="lg" disabled={selected === null} onclick={check}>
				Check answer
			</Button>
			<p class="text-center text-xs text-muted-foreground">Pick with 1–4, then press Enter</p>
		{/if}
	{/if}
</div>
