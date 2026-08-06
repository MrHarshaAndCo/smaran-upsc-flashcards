<script lang="ts">
	import { goto } from '$app/navigation';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
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

<div class="mx-auto max-w-2xl space-y-6 pt-8">
	{#if data.cards.length === 0}
		<p class="py-16 text-center text-muted-foreground">This deck has no quiz questions yet. Come back later.</p>
	{:else if session.done && session.summary}
		<div class="space-y-4">
			<p class="text-sm font-medium text-primary">Session report</p>
			<h1 class="text-4xl font-bold tracking-tight">
				{Math.round((session.summary.correct / Math.max(session.summary.total, 1)) * 100)}%
				<span class="text-lg font-medium text-muted-foreground"> — {session.summary.correct}/{session.summary.total} correct</span>
			</h1>
			<div class="grid grid-cols-3 gap-3">
				<Card class="p-4"><p class="text-xs text-muted-foreground font-medium">Lapses</p><p class="text-2xl font-bold">{session.summary.lapses}</p></Card>
				<Card class="p-4"><p class="text-xs text-muted-foreground font-medium">Missed</p><p class="text-2xl font-bold">{session.summary.missedCards}</p></Card>
				<Card class="p-4"><p class="text-xs text-muted-foreground font-medium">Re-pass</p><p class="text-2xl font-bold">{session.repass ? 'Done' : 'None'}</p></Card>
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
		<div class="flex items-center justify-between">
			<p class="text-sm font-medium text-primary">{data.deck.emoji} {data.deck.title}</p>
			<p class="text-sm text-muted-foreground">
				Question {session.answered + 1} / {session.totalInPass}{session.repass ? ' · re-test' : ''}
			</p>
		</div>
		<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<div class="h-full rounded-full bg-primary transition-all" style={`width: ${Math.min(100, (session.answered / Math.max(session.totalInPass, 1)) * 100)}%`}></div>
		</div>

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
				<Button class="w-full" size="lg" onclick={() => session.next()}>Next Question</Button>
			</div>
		{/if}
	{/if}
</div>
