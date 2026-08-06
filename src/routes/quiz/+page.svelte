<script>
	import { toast } from 'svelte-sonner';
	import { BookOpen } from 'lucide-svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { QuizSession } from '$lib/quiz/session.svelte.js';

	let { data } = $props();

	const questionTotal = $derived(data.filters.reduce((a, f) => a + f.count, 0));

	let studySubject = $state(null);
	let studySubTopic = $state('all');
	let practice = $state(null);
	let practiceBusy = $state(false);

	async function startPractice() {
		if (!studySubject) return;
		practiceBusy = true;
		try {
			const qs = new URLSearchParams({ limit: '10' });
			qs.set('subject', studySubject);
			if (studySubTopic !== 'all') qs.set('subTopic', studySubTopic);
			const r = await fetch(`/api/questions?${qs}`);
			const j = await r.json();
			if (!j.questions?.length) {
				toast.error('No questions for that topic yet');
				practiceBusy = false;
				return;
			}
			practice = new QuizSession({
				quiz: {
					id: `practice:${studySubject}`,
					title: studySubject,
					emoji: '📘',
					questions: j.questions.map((q) => ({
						id: q.id,
						question: q.question,
						options: q.options,
						correctIndex: q.answerIndex,
						explanation: q.explanation ?? ''
					}))
				},
				peerStats: {},
				nemesisStats: null,
				nemesisName: null
			});
		} catch (err) {
			toast.error('Practice failed: ' + (err?.message ?? String(err)));
		}
		practiceBusy = false;
	}

	const letters = ['A', 'B', 'C', 'D'];
</script>

<div class="space-y-6 pt-6">
	<header class="border-b border-border pb-5">
		<p class="eyebrow text-primary">Question bank</p>
		<h1 class="font-display mt-1.5 text-3xl font-semibold tracking-tight">Study</h1>
		<p class="mt-1 text-sm text-muted-foreground">{questionTotal.toLocaleString('en-IN')} real Prelims questions — practice subject by subject, topic by topic.</p>
	</header>

	{#if practice}
		<button onclick={() => (practice = null)} class="text-sm text-muted-foreground hover:text-foreground">← Back to subjects</button>
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<p class="font-mono text-xs font-medium text-primary">📘 {studySubject}</p>
				<p class="font-mono text-sm text-muted-foreground">Q {practice.idx + 1} / {practice.questions.length}</p>
			</div>
			<Progress value={practice.idx} max={practice.questions.length} />
			<Card>
				<CardHeader><CardTitle class="text-xl leading-relaxed">{practice.current.question}</CardTitle></CardHeader>
				<CardContent class="flex flex-col gap-2.5">
					{#each practice.current.options as option, i (i)}
						<Button variant={practice.optionVariant(i)} size="lg" class="h-auto w-full justify-start py-3.5 text-left" disabled={practice.answered} onclick={() => practice.choose(i)}>
							<span class="mr-2 font-mono text-sm opacity-70">{letters[i]}</span>
							<span class="whitespace-normal">{option}</span>
						</Button>
					{/each}
				</CardContent>
			</Card>
			{#if practice.answered}
				<div class="space-y-4">
					<FeedbackPanel items={practice.feedback} />
					<Button class="w-full" size="lg" onclick={() => practice.next()}>{practice.idx + 1 < practice.questions.length ? 'Next question' : 'See results'}</Button>
				</div>
			{:else}
				<Button class="w-full" size="lg" disabled={practice.selected === null} onclick={() => practice.check()}>Check answer</Button>
			{/if}
		</div>
	{:else if !studySubject}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each data.filters as f (f.subject)}
				<Card class="cursor-pointer p-5 transition-shadow hover:shadow-md" onclick={() => (studySubject = f.subject, studySubTopic = 'all')}>
					<div class="flex items-center justify-between">
						<span class="font-semibold">{f.subject}</span>
						<span class="font-mono text-xs text-muted-foreground">{f.count} questions</span>
					</div>
					<p class="mt-1 text-xs text-muted-foreground"><span class="font-mono">{f.subTopics.length}</span> sub-topics</p>
				</Card>
			{/each}
		</div>
	{:else}
		<div>
			<button onclick={() => (studySubject = null)} class="text-sm text-muted-foreground hover:text-foreground">← All subjects</button>
			<h2 class="font-display mt-2 text-xl font-semibold tracking-tight">{studySubject}</h2>
			<div class="mt-3 flex flex-wrap gap-2">
				<button onclick={() => (studySubTopic = 'all')} class="rounded-full border px-3 py-1 text-xs font-medium {studySubTopic === 'all' ? 'bg-secondary text-secondary-foreground' : 'bg-background hover:bg-muted border-input'}">All sub-topics</button>
				{#each data.filters.find((f) => f.subject === studySubject)?.subTopics ?? [] as st (st.name)}
					<button onclick={() => (studySubTopic = st.name)} class="rounded-full border px-3 py-1 text-xs font-medium {studySubTopic === st.name ? 'bg-secondary text-secondary-foreground' : 'bg-background hover:bg-muted border-input'}">{st.name} <span class="font-mono opacity-60">({st.count})</span></button>
				{/each}
			</div>
			<Button class="mt-4" size="lg" onclick={startPractice} disabled={practiceBusy}>
				<BookOpen class="size-4" /> {practiceBusy ? 'Loading…' : `Practice ${studySubject}`}
			</Button>
		</div>
	{/if}
</div>
