<script>
	import { Trophy } from 'lucide-svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import Stat from '$lib/components/Stat.svelte';

	let { data } = $props();
	let selected = $state('global');

	const entries = $derived(selected === 'global' ? data.global : data.perDeck[selected] ?? []);
	const deck = $derived(selected === 'global' ? null : data.decks.find((d) => d.id === selected));

	const myEntry = $derived(entries.find((e) => e.userId === data.user.id) ?? null);
	const myRank = $derived(entries.findIndex((e) => e.userId === data.user.id) + 1);
	const top = $derived(entries[0] ?? null);
</script>

<div class="space-y-8 pt-8">
	<div>
		<div class="flex items-center gap-2">
			<Trophy class="size-5 text-primary" />
			<h1 class="font-display text-3xl font-semibold tracking-tight">Leaderboard</h1>
		</div>
		<p class="mt-1 max-w-xl text-muted-foreground">
			Accuracy is correct answers ÷ reviews. The nemesis system pairs you with the student
			closest to your own accuracy — always someone worth catching.
		</p>
	</div>

	<div class="flex gap-2 overflow-x-auto pb-1">
		<button onclick={() => (selected = 'global')} class="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors {selected === 'global' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-muted'}">
			Global
		</button>
		{#each data.decks as d (d.id)}
			<button onclick={() => (selected = d.id)} class="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors {selected === d.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-muted'}">
				{d.emoji} {d.title}
			</button>
		{/each}
	</div>

	{#if data.user && myEntry}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			<Stat label="Your rank" value={myRank > 0 ? `#${myRank}` : '—'} sub={deck ? deck.title : 'global'} />
			<Stat label="Your accuracy" value={`${Math.round(myEntry.accuracy * 100)}%`} sub={`${myEntry.reviews} reviews`} />
			{#if top && top.userId !== data.user.id}
				<Stat label="Gap to first" value={`${Math.round((top.accuracy - myEntry.accuracy) * 100)}%`} sub={`${top.name} leads`} tone={top.accuracy - myEntry.accuracy < 0.05 ? 'green-600' : ''} />
			{/if}
		</div>
	{/if}

	<Leaderboard entries={entries} deckTitle={deck?.title} highlight={data.user?.id} />
</div>
