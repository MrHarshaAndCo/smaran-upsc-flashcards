<script>
	import { page } from '$app/state';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
	let selected = $state('global');

	const me = $derived(page.data.user ?? null);
	const entries = $derived(selected === 'global' ? data.global : data.perDeck[selected] ?? []);
	const deck = $derived(selected === 'global' ? null : data.decks.find((d) => d.id === selected));

	const myEntry = $derived(entries.find((e) => e.userId === me?.id) ?? null);
	const myRank = $derived(entries.findIndex((e) => e.userId === me?.id) + 1);
	const top = $derived(entries[0] ?? null);
</script>

<div class="space-y-8 pt-6">
	<header class="border-b border-border pb-5">
		<p class="eyebrow text-primary">The hall of names</p>
		<h1 class="font-display mt-1.5 text-3xl font-semibold tracking-tight text-foreground">Leaderboard</h1>
		<p class="mt-1 max-w-xl text-sm text-muted-foreground">
			Accuracy is correct answers ÷ reviews. The nemesis system pairs you with the student
			closest to your own accuracy — always someone worth catching.
		</p>
	</header>

	<!-- Stat board -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<Stat label="Active students" value={data.stats.activeStudents} sub="reviewed at least once" />
		<Stat label="Reviews logged" value={data.stats.totalReviews} sub="across all decks" />
		<Stat
			label="Top accuracy"
			value={data.stats.topAccuracy == null ? '—' : `${Math.round(data.stats.topAccuracy * 100)}%`}
			sub={data.stats.topName ?? 'No one yet'}
		/>
		<Stat label="Decks" value={data.decks.length} sub="flashcard sets" />
	</div>

	{#if data.stats.podium.length > 0}
		<div class="grid grid-cols-3 gap-2">
			{#each data.stats.podium as e, i (e.userId)}
				<div class="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-2 py-3 text-center">
					<span class="font-mono text-xs {i === 0 ? 'text-warning font-bold' : i === 1 ? 'text-muted-foreground font-semibold' : 'text-warning/80 font-medium'}">#{i + 1}</span>
					<span class="text-xl">{e.avatar}</span>
					<span class="w-full truncate text-xs font-medium text-foreground">{e.name}</span>
					<Badge variant="outline" class="font-mono text-xs text-muted-foreground">{Math.round(e.accuracy * 100)}%</Badge>
				</div>
			{/each}
		</div>
	{/if}

	<div class="flex gap-2 overflow-x-auto pb-1">
		<Button size="sm" variant={selected === 'global' ? 'default' : 'outline'} onclick={() => (selected = 'global')}>
			Global
		</Button>
		{#each data.decks as d (d.id)}
			<Button size="sm" variant={selected === d.id ? 'default' : 'outline'} onclick={() => (selected = d.id)}>
				{d.emoji} {d.title}
			</Button>
		{/each}
	</div>

	{#if me && myEntry}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			<Stat label="Your rank" value={myRank > 0 ? `#${myRank}` : '—'} sub={deck ? deck.title : 'global'} />
			<Stat label="Your accuracy" value={`${Math.round(myEntry.accuracy * 100)}%`} sub={`${myEntry.reviews} reviews`} />
			{#if top && top.userId !== me.id}
				<Stat label="Gap to first" value={`${Math.round((top.accuracy - myEntry.accuracy) * 100)}%`} sub={`${top.name} leads`} />
			{/if}
		</div>
	{/if}

	<Leaderboard entries={entries} deckTitle={deck?.title} highlight={me?.id} />
</div>
