<script>
	import { toast } from 'svelte-sonner';
	import { RotateCcw } from 'lucide-svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { QuizSession } from '$lib/quiz/session.svelte.js';

	let { data } = $props();

	const questionTotal = $derived(data.filters.reduce((a, f) => a + f.count, 0));

	const toQuestion = (q) => ({
		id: q.id,
		question: q.question,
		options: q.options,
		correctIndex: q.answerIndex,
		explanation: q.explanation ?? ''
	});

	let subject = $state('all');
	let busy = $state(false);
	let session = $state(
		new QuizSession({
			quiz: { id: 'quick:all', title: 'Mixed Grand Test', emoji: '⚡', questions: data.questions.map(toQuestion) },
			peerStats: {},
			nemesisStats: null,
			nemesisName: null
		})
	);

	async function startNew() {
		busy = true;
		try {
			const qs = new URLSearchParams({ limit: '50' });
			if (subject !== 'all') qs.set('subject', subject);
			const r = await fetch(`/api/questions?${qs}`);
			const j = await r.json();
			if (!j.questions?.length) {
				toast.error('No questions for that filter yet');
				busy = false;
				return;
			}
			session = new QuizSession({
				quiz: {
					id: `quick:${subject}`,
					title: subject === 'all' ? 'Mixed Grand Test' : subject,
					emoji: '⚡',
					questions: j.questions.map(toQuestion)
				},
				peerStats: {},
				nemesisStats: null,
				nemesisName: null
			});
		} catch {
			toast.error('Could not load questions');
		}
		busy = false;
	}

	async function pickSubject(s) {
		subject = s;
		await startNew();
	}

	const letters = ['A', 'B', 'C', 'D'];
</script>

<div class="mx-auto max-w-2xl space-y-6 pt-6">
	<header class="border-b border-border pb-5">
		<p class="eyebrow text-muted-foreground">{subject === 'all' ? 'GENERAL STUDIES' : subject.toUpperCase()} · {questionTotal.toLocaleString('en-IN')} questions</p>
		<h1 class="font-display mt-1.5 text-3xl font-semibold tracking-tight">Quiz</h1>
		<p class="mt-1 text-sm text-muted-foreground">50 fresh questions every visit — pick a subject or stay mixed.</p>
	</header>

	<div class="flex flex-wrap gap-2">
		<button onclick={() => pickSubject('all')} class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {subject === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-input'}">All subjects</button>
		{#each data.filters as f (f.subject)}
			<button onclick={() => pickSubject(f.subject)} class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {subject === f.subject ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-input'}">
				{f.subject} <span class="font-mono opacity-60">({f.count})</span>
			</button>
		{/each}
	</div>

	{#if session.done}
		<div class="space-y-4 pt-2">
			<p class="eyebrow text-primary">Round over</p>
			<h1 class="font-display text-6xl font-semibold tracking-tight">{Math.round((session.summary.correct / Math.max(session.summary.total, 1)) * 100)}%</h1>
			<p class="text-muted-foreground">{session.summary.correct} of {session.summary.total} correct</p>
			<FeedbackPanel items={[session.summary.advice]} />
			{#if session.summary.rivalNote}
				<FeedbackPanel items={[{ tone: 'neutral', title: 'Rival report', body: session.summary.rivalNote }]} />
			{/if}
			<div class="flex flex-wrap gap-3 pt-2">
				<Button size="lg" onclick={startNew} disabled={busy}>
					<RotateCcw class="size-4" /> {busy ? 'Loading…' : 'New 50'}
				</Button>
				<Button variant="outline" size="lg" href="/dashboard">Dashboard</Button>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<p class="font-mono text-xs font-medium text-primary">{session.quiz.emoji} {session.quiz.title}</p>
			<p class="font-mono text-sm text-muted-foreground"><span class="omr-bubble">Q {session.idx + 1}</span> / {session.questions.length}</p>
		</div>
		<Progress value={session.idx} max={session.questions.length} />
		<Card>
			<CardHeader><CardTitle class="text-xl leading-relaxed">{session.current.question}</CardTitle></CardHeader>
			<CardContent class="flex flex-col gap-2.5">
				{#each session.current.options as option, i (i)}
					<Button variant={session.optionVariant(i)} size="lg" class="h-auto w-full justify-start py-3.5 text-left" disabled={session.answered} onclick={() => session.choose(i)}>
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
			<Button class="w-full" size="lg" disabled={session.selected === null} onclick={() => session.check()}>Check answer</Button>
		{/if}
	{/if}
</div>
