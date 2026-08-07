<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { Sparkles, Award, BookOpen, Filter, X, ArrowLeft } from 'lucide-svelte';
	import QuickQuiz from '$lib/components/QuickQuiz.svelte';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import PrelimsMockSimulator from '$lib/components/PrelimsMockSimulator.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { StudySession } from '$lib/study/session.svelte.js';

	let { data } = $props();

	let activeTab = $state<'grand' | 'deck'>('grand');
	let showMockSimulator = $state(false);

	const subjectFilter = $derived(page.url.searchParams.get('subject') ?? 'all');
	const subTopicFilter = $derived(page.url.searchParams.get('subTopic') ?? 'all');

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

	// Filtered pool derived from cards and URL params
	const rawCards = $derived(data.cards || []);
	const filteredCards = $derived.by(() => {
		if (subjectFilter === 'all') return rawCards;
		return rawCards.filter((c: any) => {
			const sMatches = c.subject === subjectFilter || c.sourceQuiz === subjectFilter || c.front?.includes(subjectFilter);
			if (subTopicFilter === 'all') return sMatches;
			return sMatches && (c.subTopic === subTopicFilter || c.front?.includes(subTopicFilter));
		});
	});

	// Fallback to all cards if filter yields zero matches so quiz never breaks
	const activePoolCards = $derived(filteredCards.length > 0 ? filteredCards : rawCards);

	const grandPool = $derived(
		activePoolCards.map((c: any) => ({
			id: c.id,
			question: c.front,
			options: c.options || ['Option A', 'Option B', 'Option C', 'Option D'],
			correctIndex: c.correctIndex ?? 0,
			explanation: c.back ?? '',
			sourceQuiz: c.subject || 'Mixed Grand Test'
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

<div class="mx-auto max-w-4xl space-y-5 pt-4 sm:pt-6">
	<!-- Page Header -->
	<header class="border-b border-border pb-4 space-y-4">
		<div>
			<div class="flex items-center gap-2">
				<Sparkles class="size-5 text-primary" />
				<h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Flashcards & MCQ Arena</h1>
			</div>
			<p class="mt-1 text-xs sm:text-sm text-muted-foreground">
				Practice syllabus questions with spaced repetition flashcards or full timed mixed grand tests.
			</p>
		</div>

		<!-- Segmented 3-Tab Control Bar -->
		<div class="grid grid-cols-3 gap-1.5 p-1.5 rounded-xl bg-muted/80 border border-border/60 shadow-inner w-full">
			<button
				type="button"
				onclick={() => (activeTab = 'grand')}
				class="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 {activeTab === 'grand' ? 'bg-card text-primary font-bold shadow-sm ring-1 ring-border/60' : 'text-muted-foreground hover:text-foreground hover:bg-card/40'}"
			>
				<Sparkles class="size-4 text-primary shrink-0" />
				<span class="truncate">Mixed Grand Test</span>
			</button>

			<button
				type="button"
				onclick={() => (activeTab = 'deck')}
				class="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 {activeTab === 'deck' ? 'bg-card text-primary font-bold shadow-sm ring-1 ring-border/60' : 'text-muted-foreground hover:text-foreground hover:bg-card/40'}"
			>
				<BookOpen class="size-4 text-primary shrink-0" />
				<span class="truncate">Spaced Deck</span>
			</button>

			<button
				type="button"
				onclick={() => (showMockSimulator = true)}
				class="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 hover:text-amber-800"
			>
				<Award class="size-4 shrink-0" />
				<span class="truncate">Mock Exam</span>
			</button>
		</div>
	</header>

	<!-- Dynamic Active Filter Banner -->
	{#if subjectFilter !== 'all'}
		<div class="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs animate-in fade-in duration-200">
			<div class="flex items-center gap-2 min-w-0">
				<Filter class="size-4 text-primary shrink-0" />
				<span class="truncate text-foreground font-semibold">
					Topic Filter: <strong class="text-primary font-bold">{subjectFilter}</strong>
					{#if subTopicFilter !== 'all'}
						· <span class="text-muted-foreground font-medium">{subTopicFilter}</span>
					{/if}
				</span>
				<Badge variant="secondary" class="font-mono text-[10px] shrink-0">{grandPool.length} questions</Badge>
			</div>

			<a href="/decks">
				<Button variant="ghost" size="sm" class="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1">
					<X class="size-3.5" /> Clear Filter
				</Button>
			</a>
		</div>
	{/if}

	{#if activeTab === 'grand'}
		<!-- Mixed Grand Test View -->
		<Card class="p-4 sm:p-6 border border-border/80 bg-card space-y-4 sm:space-y-6 shadow-sm">
			<!-- Non-overlapping Header -->
			<div class="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
				<div class="flex flex-wrap items-center gap-1.5 min-w-0">
					<Badge variant="default" class="font-mono text-[10px] uppercase font-bold shrink-0">⚡ MCQ Arena Mode</Badge>
					<Badge variant="secondary" class="font-mono text-[10px] sm:text-[11px] max-w-[160px] sm:max-w-none truncate">
						{subjectFilter !== 'all' ? subjectFilter : 'All Subjects'}
					</Badge>
				</div>
				<a href="/syllabus" class="shrink-0 ml-auto">
					<Button variant="ghost" size="sm" class="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1">
						<ArrowLeft class="size-3" /> Syllabus Index
					</Button>
				</a>
			</div>

			<QuickQuiz
				questions={grandPool}
				quizId={`grand-test-${subjectFilter}`}
				emoji="⚡"
				title={subjectFilter !== 'all' ? `${subjectFilter} Quiz` : 'Mixed Grand Round'}
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
			<div class="flex flex-col items-center gap-3 py-16 text-center">
				<p class="text-3xl">📝</p>
				<p class="font-display text-xl font-semibold tracking-tight text-foreground">No quiz questions yet</p>
				<p class="max-w-sm text-xs text-muted-foreground">The question set is empty for now — check back when questions land.</p>
			</div>
		{:else if session.done && session.summary}
			<div class="space-y-4 pt-2 animate-in fade-in duration-200">
				<p class="eyebrow text-primary">Quiz Session Report</p>
				<h1 class="font-display text-4xl font-semibold tracking-tight text-foreground">
					{Math.round((session.summary.correct / Math.max(session.summary.total, 1)) * 100)}%
					<span class="text-lg font-medium text-muted-foreground"> — {session.summary.correct}/{session.summary.total} correct</span>
				</h1>
				<div class="grid grid-cols-3 gap-3">
					<Card class="p-4"><p class="text-xs text-muted-foreground font-medium">Lapses</p><p class="font-mono mt-1 text-2xl font-semibold text-foreground">{session.summary.lapses}</p></Card>
					<Card class="p-4"><p class="text-xs text-muted-foreground font-medium">Missed</p><p class="font-mono mt-1 text-2xl font-semibold text-foreground">{session.summary.missedCards}</p></Card>
					<Card class="p-4"><p class="text-xs text-muted-foreground font-medium">Re-pass</p><p class="font-mono mt-1 text-2xl font-semibold text-foreground">{session.repass ? 'Done' : 'None'}</p></Card>
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
			<div class="space-y-4">
				<div class="flex items-center justify-between text-xs">
					<p class="font-mono font-semibold text-primary">{data.deck.emoji} {data.deck.title}</p>
					<p class="font-mono text-muted-foreground"><span class="omr-bubble font-bold text-foreground">Q {session.idx + 1}</span> / {session.queue.length}{session.repass ? ' · re-test' : ''}</p>
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
					<div class="space-y-4 pt-2 animate-in fade-in duration-150">
						<FeedbackPanel items={session.feedbacks} />
						<Button class="w-full" size="lg" onclick={() => session.next()} disabled={session.posting}>
							{session.idx + 1 < session.queue.length || session.requeue.length > 0 ? 'Next Question' : 'See Results'}
						</Button>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
