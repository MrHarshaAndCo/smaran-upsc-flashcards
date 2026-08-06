<script>
	let { deck, progress = null } = $props();
</script>

<a class="deck-tile" href={`/decks/${deck.id}`} style={`--deck-color: ${deck.color}`}>
	<div class="emoji">{deck.emoji}</div>
	<div>
		<h3>{deck.title}</h3>
		<div class="sub">{deck.subtitle}</div>
	</div>
	{#if progress !== null}
		<div class="bar"><i style={`width: ${Math.round(progress * 100)}%`}></i></div>
	{/if}
	<div class="meta">
		<span>{deck.cardCount} cards</span>
		{#if progress !== null}<span>{Math.round(progress * 100)}%</span>{/if}
	</div>
</a>
