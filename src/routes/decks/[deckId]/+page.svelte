<script>
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { cardDuelLine } from '$lib/engine/nemesis.js';

	let { data } = $props();

	const myRate = $derived(
		data.myDeck && data.myDeck.total > 0 ? data.myDeck.correct / data.myDeck.total : null
	);
</script>

<div class="space-y-10 pt-8">
	<section class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<p class="text-sm font-medium text-primary">{data.deck.emoji} Study set</p>
			<h1 class="font-display text-3xl font-semibold tracking-tight">{data.deck.title}</h1>
			<p class="mt-2 max-w-xl text-muted-foreground">{data.deck.blurb}</p>
			<div class="mt-4">
				<a href={`/study/${data.deck.id}`}><Button size="lg">Start studying</Button></a>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			<Stat label="Cards" value={data.cards.length} />
			{#if myRate !== null}
				<Stat label="Your accuracy" value={`${Math.round(myRate * 100)}%`} sub={`${data.myDeck.correct}/${data.myDeck.total}`} tone={myRate >= 0.7 ? 'green-600' : myRate >= 0.4 ? 'amber-600' : 'red-600'} />
			{:else}
				<Stat label="Status" value="Untouched" sub="No reviews yet" />
			{/if}
			{#if data.peerAccuracy !== null}
				<Stat label="Peer accuracy" value={`${Math.round(data.peerAccuracy * 100)}%`} sub={`${data.myDeck?.due ?? 0} due for you`} />
			{/if}
		</div>
	</section>

	<section>
		<h2 class="mb-4 text-2xl font-bold">Leaderboard — {data.deck.title}</h2>
		<Leaderboard entries={data.entries} deckTitle={data.deck.title} highlight={data.user.id} />
	</section>

	{#if data.nemesis && data.duels.length > 0}
		<section>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Your duel with {data.nemesis.name}</h2>
				<a href="/nemesis" class="text-sm text-muted-foreground hover:text-foreground">Dossier →</a>
			</div>
			<Card class="divide-y">
				{#each data.duels as duel (duel.cardId)}
					{@const win = duel.myCorrect / duel.myTotal > duel.theirCorrect / duel.theirTotal}
					{@const loss = duel.myCorrect / duel.myTotal < duel.theirCorrect / duel.theirTotal}
					<div class="flex items-center gap-3 p-4">
						<span class={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${win ? 'bg-green-100 text-green-700' : loss ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
							{win ? '✓' : loss ? '✗' : '='}
						</span>
						<p class="text-sm">
							{cardDuelLine({
								front: duel.front.slice(0, 80) + (duel.front.length > 80 ? '…' : ''),
								myCorrect: duel.myCorrect,
								myTotal: duel.myTotal,
								theirCorrect: duel.theirCorrect,
								theirTotal: duel.theirTotal
							})}
						</p>
					</div>
				{/each}
			</Card>
		</section>
	{/if}
</div>
