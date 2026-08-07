<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Swords, Sparkles, Trophy } from 'lucide-svelte';

	let { data } = $props();
	let selected = $state('global');

	const me = $derived(page.data.user ?? null);
	const entries = $derived(selected === 'global' ? data.global : data.perDeck[selected] ?? []);
	const deck = $derived(selected === 'global' ? null : data.decks.find((d) => d.id === selected));

	const myEntry = $derived(entries.find((e: any) => e.userId === me?.id) ?? null);
	const myRank = $derived(entries.findIndex((e: any) => e.userId === me?.id) + 1);
	const top = $derived(entries[0] ?? null);

	function triggerEasterEgg(rivalName: string = top?.name || 'Rank #1 Rival', rivalId?: string) {
		toast.error('⚔️ RIVAL NEMESIS SYSTEM ACTIVATED! 🥚', {
			description: `Easter Egg Unlocked! You issued a direct Nemesis Duel Challenge to ${rivalName}! Head-to-Head battleground engaged.`,
			duration: 5000
		});

		try {
			localStorage.setItem('nemesis_challenge_active', JSON.stringify({
				rivalName,
				rivalId: rivalId || top?.userId || 'nemesis-1',
				timestamp: Date.now()
			}));
		} catch {}

		setTimeout(() => {
			goto(`/nemesis?easterEgg=true&rival=${encodeURIComponent(rivalName)}`);
		}, 800);
	}
</script>

<div class="space-y-6 pt-4 sm:pt-6">
	<header class="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2">
				<Trophy class="size-5 text-warning" />
				<p class="eyebrow text-primary">The Hall of Aspirants</p>
			</div>
			<h1 class="font-display mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Leaderboard</h1>
			<p class="mt-1 max-w-xl text-xs sm:text-sm text-muted-foreground">
				Accuracy equals correct answers ÷ total questions reviewed. Nemesis pairs you with the student closest to your accuracy level.
			</p>
		</div>

		<!-- Easter Egg Trigger Button -->
		<Button
			onclick={() => triggerEasterEgg(top?.name ?? 'Top Aspirant', top?.userId)}
			variant="outline"
			size="sm"
			class="gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 font-mono text-xs shrink-0 self-start sm:self-auto"
		>
			<Swords class="size-3.5 animate-bounce text-amber-500" />
			<span>🥚 Challenge Rank #1 Nemesis</span>
		</Button>
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

	<!-- Podium Cards -->
	{#if data.stats.podium.length > 0}
		<div class="grid grid-cols-3 gap-2">
			{#each data.stats.podium as e, i (e.userId)}
				<button
					type="button"
					onclick={() => triggerEasterEgg(e.name, e.userId)}
					class="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center hover:border-amber-500/50 hover:bg-accent/40 active:scale-[0.98] transition-all cursor-pointer group relative"
					title="Click to trigger Nemesis Duel!"
				>
					{#if i === 0}
						<span class="absolute -top-2 right-2 text-[10px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-md font-mono font-bold">🥚 Duel</span>
					{/if}
					<span class="font-mono text-xs font-bold {i === 0 ? 'text-warning' : i === 1 ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-400'}">#{i + 1}</span>
					<span class="text-2xl group-hover:scale-110 transition-transform">{e.avatar}</span>
					<span class="w-full truncate text-xs font-semibold text-foreground">{e.name}</span>
					<Badge variant="outline" class="font-mono text-[11px]">{Math.round(e.accuracy * 100)}%</Badge>
				</button>
			{/each}
		</div>
	{/if}

	<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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

	<Leaderboard
		entries={entries}
		deckTitle={deck?.title}
		highlight={me?.id}
		onChallengeRival={(rivalName, rivalId) => triggerEasterEgg(rivalName, rivalId)}
	/>
</div>
