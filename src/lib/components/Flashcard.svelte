<script>
	let { card, deck = null, flipped = $bindable(false) } = $props();
</script>

<button
	type="button"
	class="perspective-1000 w-full text-left"
	onclick={() => (flipped = !flipped)}
	aria-label="Flip card"
>
	<div class="preserve-3d relative h-72 w-full transition-transform duration-500 {flipped ? 'rotate-y-180' : ''}">
		<!-- Front -->
		<div class="backface-hidden absolute inset-0 flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm">
			{#if deck}
				<p class="text-xs font-medium text-muted-foreground">{deck.emoji} {deck.title}</p>
			{/if}
			<p class="text-xl font-semibold leading-relaxed">{card.front}</p>
			<p class="text-xs text-muted-foreground">Tap to reveal the answer</p>
		</div>
		<!-- Back -->
		<div class="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm">
			<p class="text-xs font-medium text-muted-foreground">Answer</p>
			<div class="space-y-3">
				<p class="text-lg leading-relaxed">{card.back}</p>
				{#if card.hint}
					<p class="text-sm text-muted-foreground italic">Hint: {card.hint}</p>
				{/if}
			</div>
			<p class="text-xs text-muted-foreground">Rate how well you knew it</p>
		</div>
	</div>
</button>
