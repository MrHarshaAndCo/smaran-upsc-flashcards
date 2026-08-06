<script>
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import { cardDuelLine } from '$lib/engine/nemesis.js';

	let { data } = $props();

	const myRate = $derived(
		data.myDeck && data.myDeck.total > 0 ? data.myDeck.correct / data.myDeck.total : null
	);
</script>

<div class="wrap" style="padding-top: 40px">
	<div class="card" style="border-top: 5px solid {data.deck.color}; padding: 28px">
		<div class="grid-2" style="align-items: center">
			<div>
				<p class="eyebrow">{data.deck.emoji} Study set</p>
				<h1>{data.deck.title}</h1>
				<p class="muted" style="max-width: 52ch">{data.deck.blurb}</p>
			</div>
			<div class="stat-row">
				<Stat label="Cards" value={data.cards.length} />
				{#if myRate !== null}
					<Stat label="Your accuracy" value={`${Math.round(myRate * 100)}%`} sub={`${data.myDeck.correct}/${data.myDeck.total}`} tone={myRate >= 0.7 ? 'laurel' : myRate >= 0.4 ? 'gold' : 'brick'} />
				{:else}
					<Stat label="Status" value="Untouched" sub="No reviews yet" />
				{/if}
				{#if data.peerAccuracy !== null}
					<Stat label="Peer accuracy" value={`${Math.round(data.peerAccuracy * 100)}%`} sub={`${data.myDeck?.due ?? 0} due for you now`} />
				{/if}
			</div>
		</div>
		<div style="margin-top: 22px">
			<a class="btn btn-primary" href={`/study/${data.deck.id}`}>Start studying</a>
		</div>
	</div>

	<section class="section">
		<div class="section-head">
			<h2>Leaderboard — {data.deck.title}</h2>
		</div>
		<Leaderboard entries={data.entries} deckTitle={data.deck.title} highlight={data.userId} />
	</section>

	{#if data.nemesis && data.duels.length > 0}
		<section class="section">
			<div class="section-head">
				<h2>Your duel with {data.nemesis.name}</h2>
				<a class="small" href="/nemesis">Dossier →</a>
			</div>
			<div class="card">
				{#each data.duels as duel (duel.cardId)}
					<div class="duel-row">
						<span class="duel-mark {duel.myCorrect / duel.myTotal > duel.theirCorrect / duel.theirTotal ? 'win' : duel.myCorrect / duel.myTotal < duel.theirCorrect / duel.theirTotal ? 'loss' : 'draw'}">
							{duel.myCorrect / duel.myTotal > duel.theirCorrect / duel.theirTotal ? '✓' : duel.myCorrect / duel.myTotal < duel.theirCorrect / duel.theirTotal ? '✗' : '='}
						</span>
						<span style="flex: 1">{cardDuelLine({ front: duel.front.slice(0, 80) + (duel.front.length > 80 ? '…' : ''), myCorrect: duel.myCorrect, myTotal: duel.myTotal, theirCorrect: duel.theirCorrect, theirTotal: duel.theirTotal })}</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>
