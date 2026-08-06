<script>
	import { Card } from '$lib/components/ui/card';

	let { deck, progress = null } = $props();
</script>

<a href={`/decks/${deck.id}`} class="block">
	<Card class="h-full p-5 transition-shadow hover:shadow-md">
		<div class="mb-3 text-2xl">{deck.emoji}</div>
		<h3 class="font-semibold">{deck.title}</h3>
		<p class="text-sm text-muted-foreground">{deck.subtitle}</p>
		<div class="mt-4 flex items-center justify-between text-xs text-muted-foreground">
			<span>{deck.cardCount} cards</span>
			{#if progress !== null}<span class="font-medium text-foreground">{Math.round(progress * 100)}% done</span>{/if}
		</div>
		{#if progress !== null}
			<div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div class="h-full rounded-full bg-primary" style={`width: ${Math.round(progress * 100)}%`} />
			</div>
		{/if}
	</Card>
</a>
