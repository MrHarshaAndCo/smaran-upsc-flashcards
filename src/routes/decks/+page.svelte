<script lang="ts">
	import { goto } from '$app/navigation';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
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

<div class="mx-auto max-w-2xl space-y-6 pt-6">
	{#if !data.cards.length}
		<div class="flex flex-col items-center gap-3 py-20 text-center">
			<p class="text-3xl">📝</p>
			<p class="font-display text-xl font-semibold tracking-tight">No quiz questions yet</p>
			<p class="max-w-sm text-sm text-muted-foreground">The question set is empty for now — check back when questions land.</p>
		</div>
	{:else if session.done && session.summary}
		<div class="space-y-4 pt-2">
			<p class="eyebrow text-primary">Quiz session report</p>
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
				<FeedbackPanel items={[{ tone: 'neutral', title: 'Rival report', body: session.summary.nemesisNote }]} />
			{/if}
			<div class="flex flex-wrap gap-3 pt-2">
				<Button onclick={() => session.restart()} disabled={session.posting}>Practice again</Button>
				<Button variant="outline" onclick={() => goto('/dashboard')} disabled={session.posting}>View dashboard</Button>
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
</div>
