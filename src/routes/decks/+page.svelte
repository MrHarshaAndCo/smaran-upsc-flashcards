<script>
	import DeckCard from '$lib/components/DeckCard.svelte';

	let { data } = $props();
</script>

<div class="wrap" style="padding-top: 40px">
	<p class="eyebrow">Study sets</p>
	<h1 style="margin-bottom: 6px">All decks</h1>
	<p class="muted" style="max-width: 56ch">
		Pick a deck, study the cards, and let the scheduler tell you when to come back. Your
		progress on each deck is marked below.
	</p>

	<section class="section">
		<div class="deck-grid">
			{#each data.decks as deck (deck.id)}
				<DeckCard {deck} progress={data.progress.get(deck.id) ?? null} />
			{/each}
		</div>
	</section>
</div>
