<script>
	import { h2hRecord } from '$lib/engine/nemesis.js';
	import { Card } from '$lib/components/ui/card';

	let { decks = [], empty = 'No shared decks yet.' } = $props();
</script>

<Card class="divide-y">
	{#if decks.length === 0}
		<p class="p-6 text-center text-sm text-muted-foreground">{empty}</p>
	{:else}
		{#each decks as d (d.deckId)}
			{@const r = h2hRecord({ myCorrect: d.myCorrect, myTotal: d.myTotal, theirCorrect: d.theirCorrect, theirTotal: d.theirTotal })}
			<div class="flex items-center justify-between gap-3 p-4 text-sm">
				<span class="font-medium">{d.emoji} {d.deckTitle}</span>
				<span class="text-xs text-muted-foreground">{d.myCorrect}/{d.myTotal} vs {d.theirCorrect}/{d.theirTotal}</span>
				<span class={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${r.outcome === 'win' ? 'bg-green-100 text-green-700' : r.outcome === 'loss' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
					{r.outcome === 'win' ? 'You lead' : r.outcome === 'loss' ? 'They lead' : 'Even'}
				</span>
			</div>
		{/each}
	{/if}
</Card>
