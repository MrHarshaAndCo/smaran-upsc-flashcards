<script>
	import { Card } from '$lib/components/ui/card';

	let { deck, progress = null } = $props();
</script>

<a href={`/decks/${deck.id}`} class="group block">
	<Card class="h-full p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md">
		<div class="mb-3 flex items-start justify-between gap-2">
			<span class="text-2xl leading-none">{deck.emoji}</span>
			<span class="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{deck.cardCount} cards</span>
		</div>
		<h3 class="font-display text-lg font-semibold tracking-tight">{deck.title}</h3>
		<p class="mt-0.5 text-sm leading-snug text-muted-foreground">{deck.subtitle}</p>
		{#if progress !== null}
			<div class="mt-4">
				<div class="flex items-center justify-between text-xs">
					<span class="font-mono text-muted-foreground">{Math.round(progress * 100)}% done</span>
				</div>
				<div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
					<div class="h-full rounded-full bg-primary transition-all duration-300" style={`width: ${Math.round(progress * 100)}%`} />
				</div>
			</div>
		{:else}
			<p class="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">Not started</p>
		{/if}
	</Card>
</a>
