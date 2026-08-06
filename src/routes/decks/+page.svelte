<script>
	import DeckCard from '$lib/components/DeckCard.svelte';

	let { data } = $props();
</script>

<div class="space-y-8 pt-6">
	<header class="border-b border-border pb-5">
		<p class="eyebrow text-primary">Flashcards</p>
		<h1 class="font-display mt-1.5 text-3xl font-semibold tracking-tight">All decks</h1>
		<p class="mt-1 text-sm text-muted-foreground">Pick a deck and study — spaced repetition keeps the due pile small.</p>
	</header>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.decks as deck (deck.id)}
			<DeckCard {deck} progress={data.progress.get(deck.id) ?? null} />
		{/each}
	</div>
</div>
