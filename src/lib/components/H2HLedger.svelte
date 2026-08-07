<script>
	import { h2hRecord } from '$lib/engine/nemesis.js';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let { decks = [], empty = 'No shared decks yet.' } = $props();
</script>

<Card class="divide-y divide-border">
	{#if decks.length === 0}
		<p class="p-6 text-center text-sm text-muted-foreground">{empty}</p>
	{:else}
		{#each decks as d (d.deckId)}
			{@const r = h2hRecord({ myCorrect: d.myCorrect, myTotal: d.myTotal, theirCorrect: d.theirCorrect, theirTotal: d.theirTotal })}
			<div class="flex items-center justify-between gap-3 p-4 text-sm">
				<span class="font-medium text-foreground">{d.emoji} {d.deckTitle}</span>
				<span class="text-xs text-muted-foreground">{d.myCorrect}/{d.myTotal} vs {d.theirCorrect}/{d.theirTotal}</span>
				<Badge variant={r.outcome === 'win' ? 'success' : r.outcome === 'loss' ? 'destructive' : 'secondary'} class="shrink-0 font-medium">
					{r.outcome === 'win' ? 'You lead' : r.outcome === 'loss' ? 'They lead' : 'Even'}
				</Badge>
			</div>
		{/each}
	{/if}
</Card>
