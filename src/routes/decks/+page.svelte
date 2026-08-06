<script>
	import DeckCard from '$lib/components/DeckCard.svelte';

	let { data } = $props();
</script>

<div class="space-y-8 pt-8">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">All decks</h1>
		<p class="mt-1 text-muted-foreground">
			Pick a deck and study. Your progress on each set is marked below.
		</p>
	</div>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.decks as deck (deck.id)}
			<DeckCard {deck} progress={data.progress.get(deck.id) ?? null} />
		{/each}
	</div>
</div>
