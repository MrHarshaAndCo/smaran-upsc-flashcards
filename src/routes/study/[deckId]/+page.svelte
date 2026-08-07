<script lang="ts">
	import { goto } from '$app/navigation';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { StudySession } from '$lib/study/session.svelte.js';

	let { data } = $props();

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
</script>

<div class="mx-auto max-w-3xl space-y-5 pt-4 sm:pt-6 px-2 sm:px-0">
	{#if data.cards.length === 0}
		<div class="py-16 text-center space-y-3">
			<p class="text-3xl">📝</p>
			<p class="font-display text-xl font-semibold tracking-tight text-foreground">No questions in this deck</p>
			<p class="text-xs text-muted-foreground max-w-sm mx-auto">This study set has no quiz questions loaded yet. Check back later.</p>
			<Button variant="outline" onclick={() => goto('/study')}>Back to Study Hub</Button>
		</div>
	{:else if session.done && session.summary}
		<div class="space-y-4 pt-2 animate-in fade-in duration-200">
			<p class="eyebrow text-primary">Session report</p>
			<h1 class="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
				{Math.round((session.summary.correct / Math.max(session.summary.total, 1)) * 100)}%
				<span class="text-base sm:text-lg font-medium text-muted-foreground"> — {session.summary.correct}/{session.summary.total} correct</span>
			</h1>
			<div class="grid grid-cols-3 gap-3">
				<Card class="p-3.5 text-center"><p class="text-xs text-muted-foreground font-medium">Lapses</p><p class="text-xl sm:text-2xl font-bold font-mono mt-1 text-foreground">{session.summary.lapses}</p></Card>
				<Card class="p-3.5 text-center"><p class="text-xs text-muted-foreground font-medium">Missed</p><p class="text-xl sm:text-2xl font-bold font-mono mt-1 text-foreground">{session.summary.missedCards}</p></Card>
				<Card class="p-3.5 text-center"><p class="text-xs text-muted-foreground font-medium">Re-pass</p><p class="text-xl sm:text-2xl font-bold font-mono mt-1 text-foreground">{session.repass ? 'Done' : 'None'}</p></Card>
			</div>
			{#if session.summary.advice}
				<FeedbackPanel items={[session.summary.advice]} />
			{/if}
			{#if session.summary.nemesisNote}
				<FeedbackPanel items={[{ tone: 'neutral', title: 'Rival report', body: session.summary.nemesisNote }]} />
			{/if}
			<div class="flex flex-wrap gap-3 pt-2">
				<Button onclick={() => session.restart()} disabled={session.posting}>Study again</Button>
				<Button variant="outline" onclick={() => goto('/dashboard')} disabled={session.posting}>View dashboard</Button>
			</div>
		</div>
	{:else if session.current}
		<div class="space-y-3">
			<div class="flex items-center justify-between text-xs">
				<p class="font-mono font-semibold text-primary flex items-center gap-1.5">
					<span>{data.deck.emoji}</span>
					<span>{data.deck.title}</span>
				</p>
				<p class="font-mono text-muted-foreground">
					<span class="omr-bubble font-bold text-foreground">Question {session.answered + 1}</span> / {session.totalInPass}{session.repass ? ' · re-test' : ''}
				</p>
			</div>
			
			<Progress value={session.answered} max={Math.max(session.totalInPass, 1)} />

			{#key session.current.id}
				<Flashcard
					card={session.current}
					deck={data.deck}
					onAnswer={handleCardAnswer}
				/>
			{/key}

			{#if session.rated}
				<div class="space-y-3 pt-2 animate-in fade-in duration-150">
					<FeedbackPanel items={session.feedbacks} />
					<Button class="w-full" size="lg" onclick={() => session.next()}>Next Question</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>
