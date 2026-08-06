<script>
	import { goto } from '$app/navigation';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
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

	$effect(() => {
		function onKey(e) {
			if (session.done) return;
			if (e.key === ' ' || e.key === 'Enter') {
				if (!session.flipped) { e.preventDefault(); session.flipped = true; }
			} else if (session.flipped && !session.rated) {
				const map = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
				if (map[e.key]) session.rate(map[e.key]);
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div class="mx-auto max-w-2xl space-y-6 pt-6">
	{#if !data.cards.length}
		<div class="flex flex-col items-center gap-3 py-20 text-center">
			<p class="text-3xl">🃏</p>
			<p class="font-display text-xl font-semibold tracking-tight">No flashcards yet</p>
			<p class="max-w-sm text-sm text-muted-foreground">The card sets are empty for now — come back when they land.</p>
		</div>
	{:else if session.done}
		<div class="space-y-4 pt-2">
			<p class="eyebrow text-primary">Session report</p>
			<h1 class="font-display text-4xl font-semibold tracking-tight">
				{Math.round((session.summary.correct / Math.max(session.summary.total, 1)) * 100)}%
				<span class="text-lg font-medium text-muted-foreground"> — {session.summary.correct}/{session.summary.total} correct</span>
			</h1>
			<div class="grid grid-cols-3 gap-3">
				<Card class="p-4"><p class="text-xs text-muted-foreground">Lapses</p><p class="font-mono mt-1 text-2xl font-semibold">{session.summary.lapses}</p></Card>
				<Card class="p-4"><p class="text-xs text-muted-foreground">Missed</p><p class="font-mono mt-1 text-2xl font-semibold">{session.summary.missedCards}</p></Card>
				<Card class="p-4"><p class="text-xs text-muted-foreground">Re-pass</p><p class="font-mono mt-1 text-2xl font-semibold">{session.repass ? 'Done' : 'None'}</p></Card>
			</div>
			<FeedbackPanel items={[session.summary.advice]} />
			{#if session.summary.nemesisNote}
				<FeedbackPanel items={[{ tone: 'neutral', title: 'Rival report', body: session.summary.nemesisNote }]} />
			{/if}
			<div class="flex flex-wrap gap-3 pt-2">
				<Button onclick={() => session.restart()} disabled={session.posting}>Study again</Button>
				<Button variant="outline" onclick={() => goto('/dashboard')} disabled={session.posting}>View dashboard</Button>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<p class="font-mono text-xs font-medium text-primary">{data.deck.emoji} {data.deck.title}</p>
			<p class="font-mono text-sm text-muted-foreground"><span class="omr-bubble">Q {session.idx + 1}</span> / {session.queue.length}{session.repass ? ' · re-test' : ''}</p>
		</div>
		<Progress value={session.idx} max={session.queue.length} />
		<Card>
			<CardHeader><CardTitle class="text-xl leading-relaxed">{session.current.front}</CardTitle></CardHeader>
			<CardContent class="flex flex-col gap-4">
				{#if !session.flipped}
					<Button class="w-full" size="lg" variant="outline" onclick={() => (session.flipped = true)}>Reveal answer</Button>
				{:else}
					<div class="rounded-md border border-primary/20 bg-accent p-4">
						<p class="text-xs text-muted-foreground">Answer</p>
						<p class="mt-1 text-base font-medium">{session.current.back}</p>
						{#if session.current.hint}<p class="mt-2 text-xs text-muted-foreground">{session.current.hint}</p>{/if}
					</div>
					{#if session.rated}
						<FeedbackPanel items={session.feedbacks} />
						<Button class="w-full" size="lg" onclick={() => session.next()} disabled={session.posting}>
							{session.idx + 1 < session.queue.length || session.requeue.length > 0 ? 'Next card' : 'See results'}
						</Button>
					{:else}
						<div class="grid grid-cols-4 gap-2">
							<Button variant="outline" class="h-12 border-red-300 text-red-700 hover:bg-red-50" onclick={() => session.rate('again')}>1 · Again</Button>
							<Button variant="outline" class="h-12 border-amber-300 text-amber-700 hover:bg-amber-50" onclick={() => session.rate('hard')}>2 · Hard</Button>
							<Button variant="outline" class="h-12 border-green-300 text-green-700 hover:bg-green-50" onclick={() => session.rate('good')}>3 · Good</Button>
							<Button variant="outline" class="h-12 border-primary/40 text-primary hover:bg-primary/10" onclick={() => session.rate('easy')}>4 · Easy</Button>
						</div>
					{/if}
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
