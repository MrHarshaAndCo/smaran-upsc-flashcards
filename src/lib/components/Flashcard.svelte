<script>
	let { card, flipped = $bindable(), deck = null, onflip = () => {} } = $props();

	function toggle() {
		flipped = !flipped;
		onflip(flipped);
	}
</script>

<div class="flip-wrap">
	<div class="flip-card" class:flipped role="button" tabindex="0" onclick={toggle} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}>
		<div class="flip-face front">
			{#if deck}<span class="deck-mark">{deck.emoji} {deck.title}</span>{/if}
			<p class="q">{card.front}</p>
			<span class="deck-mark">Tap to reveal</span>
		</div>
		<div class="flip-face back">
			<span class="deck-mark">Answer</span>
			<p class="a">{card.back}</p>
			{#if card.hint}<p class="hint">Hint: {card.hint}</p>{/if}
		</div>
	</div>
</div>
