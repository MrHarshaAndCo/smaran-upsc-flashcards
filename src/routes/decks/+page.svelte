<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { Sparkles, Award, BookOpen } from 'lucide-svelte';
	import QuickQuiz from '$lib/components/QuickQuiz.svelte';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import PrelimsMockSimulator from '$lib/components/PrelimsMockSimulator.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { StudySession } from '$lib/study/session.svelte.js';

	let { data } = $props();

	let activeTab = $state<'grand' | 'deck'>('grand');
	let showMockSimulator = $state(false);

	const session = new StudySession({
		deck: data.deck,
		cards: data.cards,
		cardStates: data.cardStates,
		peerStats: data.peerStats,
		nemesisStats: data.nemesisStats,
		nemesisName: data.nemesisName,
		nemesisUserId: data.nemesisUserId,
		myMeta: data.myMeta,
		userName: data.user?.name
	});

	function handleCardAnswer(isCorrect: boolean) {
		session.rate(isCorrect ? 'good' : 'again');
	}

	const grandPool = $derived(
		(data.cards || []).map((c: any) => ({
			id: c.id,
			question: c.front,
			options: c.options || ['Option A', 'Option B', 'Option C', 'Option D'],
			correctIndex: c.correctIndex ?? 0,
			explanation: c.back ?? '',
			sourceQuiz: 'Mixed Grand Test'
		}))
	);
</script>

{#if showMockSimulator}
	<PrelimsMockSimulator
		questions={grandPool}
		onClose={() => (showMockSimulator = false)}
		onFinish={(scorecard) => {
			toast.success(`Mock Exam Submitted! Score: ${scorecard.scaledScore200}/200 Marks`, {
				description: scorecard.cutoffVerdict.label
			});
		}}
	/>
{/if}

<div class="mx-auto max-w-4xl space-y-6 pt-6">
	<!-- Page Header -->
	<header class="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2">
				<Sparkles class="size-5 text-primary" />
				<h1 class="font-display text-3xl font-bold tracking-tight text-foreground">Flashcards & MCQ Arena</h1>
			</div>
			<p class="mt-1 text-sm text-muted-foreground">
				Take full mixed grand tests across the entire syllabus or practice spaced repetition MCQ flashcards.
			</p>
		</div>

		<!-- Native Shadcn UI Tabs -->
		<Tabs value={activeTab} onValueChange={(v) => (activeTab = v as any)}>
			<TabsList variant="line" class="border-b border-border">
				<TabsTrigger value="grand" class="gap-1.5 font-semibold">
					<Sparkles class="size-3.5" />
					<span>Mixed Grand Test</span>
				</TabsTrigger>

				<TabsTrigger value="deck" class="gap-1.5 font-semibold">
					<BookOpen class="size-3.5" />
					<span>Spaced Deck</span>
				</TabsTrigger>

				<Button
					variant="ghost"
					size="sm"
					onclick={() => (showMockSimulator = true)}
					class="gap-1.5 text-xs font-semibold text-warning hover:text-warning hover:bg-warning/10"
				>
					<Award class="size-3.5" />
					<span>Mock Exam (-0.66)</span>
				</Button>
			</TabsList>
		</Tabs>
	</header>

	{#if activeTab === 'grand'}
		<!-- Mixed Grand Test View -->
		<Card class="p-6 border border-border/80 bg-card space-y-6 shadow-sm">
			<div class="flex items-center justify-between border-b border-border/40 pb-3">
				<div class="flex items-center gap-2">
					<Badge variant="default" class="font-mono text-[10px] uppercase font-bold">⚡ Mixed Grand Test Mode</Badge>
					<Badge variant="secondary" class="font-mono text-[11px]">All Syllabus Subjects</Badge>
				</div>
			</div>

			<QuickQuiz
				questions={grandPool}
				quizId="grand-test-mixed"
				emoji="⚡"
				title="Mixed Grand Round"
				perRound={10}
				nemesisStats={data.nemesisStats}
				nemesisName={data.nemesisName}
				nemesisUserId={data.nemesisUserId}
				userName={data.user?.name ?? 'Aspirant'}
			/>
		</Card>
	{:else if activeTab === 'deck'}
		<!-- Spaced Repetition Deck Session View -->
		{#if !data.cards.length}
			<div class="flex flex-col items-center gap-3 py-20 text-center">
				<p class="text-3xl">📝</p>
				<p class="font-display text-xl font-semibold tracking-tight">No quiz questions yet</p>
				<p class="max-w-sm text-sm text-muted-foreground">The question set is empty for now — check back when questions land.</p>
			</div>
		{:else if session.done && session.summary}
			<div class="space-y-4 pt-2">
				<p class="eyebrow text-primary">Quiz Session Report</p>
				<h1 class="font-display text-4xl font-semibold tracking-tight">
					{Math.round((session.summary.correct / Math.max(session.summary.total, 1)) * 100)}%
					<span class="text-lg font-medium text-muted-foreground"> — {session.summary.correct}/{session.summary.total} correct</span>
				</h1>
				<div class="grid grid-cols-3 gap-3">
					<Card class="p-4"><p class="text-xs text-muted-foreground font-medium">Lapses</p><p class="font-mono mt-1 text-2xl font-semibold">{session.summary.lapses}</p></Card>
					<Card class="p-4"><p class="text-xs text-muted-foreground font-medium">Missed</p><p class="font-mono mt-1 text-2xl font-semibold">{session.summary.missedCards}</p></Card>
					<Card class="p-4"><p class="text-xs text-muted-foreground font-medium">Re-pass</p><p class="font-mono mt-1 text-2xl font-semibold">{session.repass ? 'Done' : 'None'}</p></Card>
				</div>
				{#if session.summary.advice}
					<FeedbackPanel items={[session.summary.advice]} />
				{/if}
				{#if session.summary.nemesisNote}
					<FeedbackPanel items={[{ tone: 'neutral', title: 'Rival Report', body: session.summary.nemesisNote }]} />
				{/if}
				<div class="flex flex-wrap gap-3 pt-2">
					<Button onclick={() => session.restart()} disabled={session.posting}>Practice Again</Button>
					<Button variant="outline" onclick={() => (activeTab = 'grand')}>Back to Grand Test</Button>
				</div>
			</div>
		{:else if session.current}
			<div class="flex items-center justify-between">
				<p class="font-mono text-xs font-medium text-primary">{data.deck.emoji} {data.deck.title}</p>
				<p class="font-mono text-sm text-muted-foreground"><span class="omr-bubble">Q {session.idx + 1}</span> / {session.queue.length}{session.repass ? ' · re-test' : ''}</p>
			</div>
			<Progress value={session.idx} max={session.queue.length} />

			{#key session.current.id}
				<Flashcard
					card={session.current}
					deck={data.deck}
					onAnswer={handleCardAnswer}
				/>
			{/key}

			{#if session.rated}
				<div class="space-y-4 pt-2">
					<FeedbackPanel items={session.feedbacks} />
					<Button class="w-full" size="lg" onclick={() => session.next()} disabled={session.posting}>
						{session.idx + 1 < session.queue.length || session.requeue.length > 0 ? 'Next Question' : 'See Results'}
					</Button>
				</div>
			{/if}
		{/if}
	{/if}
</div>
