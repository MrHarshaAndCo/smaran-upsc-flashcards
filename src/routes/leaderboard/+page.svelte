<script>
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import Stat from '$lib/components/Stat.svelte';

	let { data } = $props();
	let selected = $state('global');

	const entries = $derived(selected === 'global' ? data.global : data.perDeck[selected] ?? []);
	const deck = $derived(selected === 'global' ? null : data.decks.find((d) => d.id === selected));

	const myEntry = $derived(entries.find((e) => e.userId === data.userId) ?? null);
	const myRank = $derived(entries.findIndex((e) => e.userId === data.userId) + 1);
	const top = $derived(entries[0] ?? null);
</script>

<div class="wrap" style="padding-top: 40px">
	<p class="eyebrow">Scoreboard</p>
	<h1 style="margin-bottom: 6px">Leaderboard</h1>
	<p class="muted" style="max-width: 56ch">
		Accuracy is correct answers ÷ reviews. The nemesis system pairs you with the student
		closest to your own accuracy — so there is always someone worth catching.
	</p>

	<div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 20px 0">
		<button class="chip flat" style="cursor: pointer; padding: 7px 14px; {selected === 'global' ? 'background: var(--ink); color: var(--paper);' : ''}" onclick={() => (selected = 'global')}>Global</button>
		{#each data.decks as d (d.id)}
			<button class="chip flat" style="cursor: pointer; padding: 7px 14px; {selected === d.id ? 'background: var(--ink); color: var(--paper);' : ''}" onclick={() => (selected = d.id)}>{d.emoji} {d.title}</button>
		{/each}
	</div>

	{#if data.userId && myEntry}
		<div class="stat-row" style="margin-bottom: 18px">
			<Stat label="Your rank" value={myRank > 0 ? `#${myRank}` : '—'} sub={deck ? deck.title : 'global'} />
			<Stat label="Your accuracy" value={`${Math.round(myEntry.accuracy * 100)}%`} sub={`${myEntry.reviews} reviews`} />
			{#if top && top.userId !== data.userId}
				<Stat label="Gap to first" value={`${Math.round((top.accuracy - myEntry.accuracy) * 100)}%`} sub={`${top.name} leads`} tone={top.accuracy - myEntry.accuracy < 0.05 ? 'laurel' : ''} />
			{/if}
		</div>
	{/if}

	<Leaderboard entries={entries} deckTitle={deck?.title} highlight={data.userId} />
</div>
