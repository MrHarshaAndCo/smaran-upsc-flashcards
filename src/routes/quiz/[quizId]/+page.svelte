<script>
	import { goto } from '$app/navigation';
	import { PenLine } from 'lucide-svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { QuizSession } from '$lib/quiz/session.svelte.js';

	let { data } = $props();

	// svelte-ignore state_referenced_locally — server load data is static per page
	const session = new QuizSession({
		quiz: data.quiz,
		peerStats: data.peerStats,
		nemesisStats: data.nemesisStats,
		nemesisName: data.nemesisName,
		userName: data.user?.name
	});

	const letters = ['A', 'B', 'C', 'D'];

	$effect(() => {
		function onKey(e) {
			if (session.done) return;
			const n = parseInt(e.key, 10);
			if (!session.answered && n >= 1 && n <= session.questions.length) {
				session.selected = n - 1;
			} else if (!session.answered && session.selected !== null && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				session.check();
			} else if (session.answered && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				session.next();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div class="mx-auto max-w-2xl space-y-6 pt-8">
	{#if session.done}
		<div class="space-y-4">
			<p class="text-sm font-medium text-primary">{data.quiz.emoji} {data.quiz.title} · report</p>
			<h1 class="text-4xl font-bold tracking-tight">
				{Math.round((session.summary.correct / Math.max(session.summary.total, 1)) * 100)}%
				<span class="text-lg font-medium text-muted-foreground"> — {session.summary.correct}/{session.summary.total} correct</span>
			</h1>
			<FeedbackPanel items={[session.summary.advice]} />
			{#if session.summary.aiCoach}
				<FeedbackPanel items={[{ tone: 'bad', title: 'Coach', body: session.summary.aiCoach }]} />
			{/if}
			{#if session.summary.rivalNote}
				<FeedbackPanel items={[{ tone: 'neutral', title: 'Rival report', body: session.summary.rivalNote }]} />
			{/if}

			<div class="rounded-lg border divide-y">
				{#each session.questions as q, i (q.id)}
					{@const r = session.results[i]}
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
				<Button onclick={() => session.restart()} disabled={session.posting}>Retake quiz</Button>
				<Button variant="outline" onclick={() => goto('/quiz')} disabled={session.posting}>All quizzes</Button>
				<Button variant="ghost" onclick={() => goto('/dashboard')} disabled={session.posting}>Dashboard</Button>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<p class="text-sm font-medium text-primary">{data.quiz.emoji} {data.quiz.title}</p>
			<p class="text-sm text-muted-foreground">Q {session.idx + 1} / {session.questions.length}</p>
		</div>
		<Progress value={session.idx} max={session.questions.length} />

		<Card>
			<CardHeader>
				<div class="flex items-start gap-2">
					<PenLine class="mt-1 size-4 shrink-0 text-primary" />
					<CardTitle class="text-xl leading-relaxed">{session.current.question}</CardTitle>
				</div>
			</CardHeader>
			<CardContent class="flex flex-col gap-2.5">
				{#each session.current.options as option, i (i)}
					<Button
						variant={session.optionVariant(i)}
						size="lg"
						class="h-auto w-full justify-start py-3.5 text-left"
						disabled={session.answered}
						onclick={() => session.choose(i)}
					>
						<span class="mr-2 font-mono text-sm opacity-70">{letters[i]}</span>
						<span class="whitespace-normal">{option}</span>
					</Button>
				{/each}
			</CardContent>
		</Card>

		{#if session.answered}
			<div class="space-y-4">
				<FeedbackPanel items={session.feedback} />
				<Button class="w-full" size="lg" onclick={() => session.next()}>
					{session.idx + 1 < session.questions.length ? 'Next question' : 'See results'}
				</Button>
			</div>
		{:else}
			<Button class="w-full" size="lg" disabled={session.selected === null} onclick={() => session.check()}>
				Check answer
			</Button>
			<p class="text-center text-xs text-muted-foreground">Pick with 1–4, then press Enter</p>
		{/if}
	{/if}
</div>
