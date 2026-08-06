<script>
	import { Card } from '$lib/components/ui/card';

	/** @type {{ deck: import('$lib/data/store.js').Deck, progress: number, due: number, newCards: number }} */
	let { s } = $props();
	const { deck, progress, due, newCards } = s;
</script>

<a href={`/study/${deck.id}`} class="group block">
	<Card class="h-full p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md">
		<div class="mb-3 flex items-start justify-between gap-2">
			<span class="text-2xl leading-none">{deck.emoji}</span>
			<span class="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{deck.cardCount} cards</span>
		</div>
		<h3 class="font-display text-lg font-semibold tracking-tight">{deck.title}</h3>
		<p class="mt-0.5 text-sm leading-snug text-muted-foreground">{deck.subtitle}</p>
		<div class="mt-4 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
			{#if due > 0}
				<span class="text-primary">{due} due</span>
			{:else}
				<span>Nothing due</span>
			{/if}
			{#if newCards > 0}
				<span>{newCards} new</span>
			{:else}
				<span class="text-success">Finished</span>
			{/if}
		</div>
		<div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<div class="h-full rounded-full bg-primary transition-all duration-300" style={`width: ${Math.round(progress * 100)}%`} />
		</div>
	</Card>
</a>
