<script>
	import { goto } from '$app/navigation';
	import { Users, Target, Trophy, Swords } from 'lucide-svelte';
	import DuelRow from '$lib/components/DuelRow.svelte';
	import H2HLedger from '$lib/components/H2HLedger.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import { Card } from '$lib/components/ui/card';
	import { cardDuelLine } from '$lib/engine/nemesis.js';

	let { data } = $props();

	let selected = $state(data.target?.id ?? '');

	function challenge(e) {
		const id = e.target.value;
		selected = id;
		if (id) goto(`/colab?student=${id}`, { invalidateAll: true });
	}

	function myRate(d) {
		return d.total === 0 ? 0 : d.correct / d.total;
	}

	const SHORT = {
		polity: 'Polity',
		'modern-history': 'History',
		geography: 'Geography',
		'art-culture': 'Culture',
		economy: 'Economy'
	};
</script>

<div class="space-y-8 pt-6">
	<!-- Header -->
	<div>
		<div class="flex items-center gap-2">
			<Users class="size-5 text-primary" />
			<h1 class="font-display text-3xl font-semibold tracking-tight">Colab</h1>
		</div>
		<p class="mt-1 max-w-xl text-muted-foreground">
			How you stack up against the whole room — and anyone in it. Pick a student, see the
			head-to-head, and decide who to catch.
		</p>
	</div>

	<!-- Position stats -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<Stat label="Your rank" value={`#${data.myRank}`} sub={`of ${data.leaderboard.length} students`} />
		<Stat
			label="Gap to first"
			value={data.top ? `${Math.round((data.top.accuracy - (data.me?.accuracy ?? 0)) * 100)}%` : '—'}
			sub={data.top?.name ?? 'No one yet'}
			tone={data.top && data.top.userId === data.userId ? 'green-600' : ''}
		/>
		<Stat label="Ahead of you" value={Math.max(0, data.myRank - 1)} sub="students to overtake" />
		{#if data.me}
			<Stat label="Your accuracy" value={`${Math.round(data.me.accuracy * 100)}%`} sub={`${data.me.reviews} reviews`} />
		{/if}
	</div>

	<!-- You vs the room per deck -->
	<section>
		<SectionHeader icon={Target} title="You vs the room" />
		<Card class="divide-y">
			{#each data.perDeck as d (d.deckId)}
				<div class="p-4">
					<div class="flex items-center justify-between text-sm">
						<span class="font-medium">{d.emoji} {d.title}</span>
						<span class="text-xs text-muted-foreground">
							<span class="font-semibold text-foreground">{Math.round(myRate(d) * 100)}%</span> vs room
							<span class="font-semibold text-foreground"> {data.room[d.deckId] == null ? '—' : `${Math.round(data.room[d.deckId] * 100)}%`}</span>
						</span>
					</div>
					<div class="mt-2 space-y-1">
						<div class="flex items-center gap-2 text-[10px] text-muted-foreground">
							<span class="w-8">You</span>
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
								<div class="h-full rounded-full bg-primary" style={`width: ${Math.round(myRate(d) * 100)}%`} />
							</div>
						</div>
						<div class="flex items-center gap-2 text-[10px] text-muted-foreground">
							<span class="w-8">Room</span>
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
								<div class="h-full rounded-full bg-muted-foreground/40" style={`width: ${data.room[d.deckId] == null ? 0 : Math.round(data.room[d.deckId] * 100)}%`} />
							</div>
						</div>
					</div>
				</div>
			{/each}
		</Card>
	</section>

	<!-- Challenge a student -->
	<section>
		<SectionHeader icon={Swords} title="Challenge a student" />
		<div class="mb-4 max-w-md">
			<select
				value={selected}
				onchange={challenge}
				class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
				aria-label="Choose a student to compare with"
			>
				<option value="">Choose a student…</option>
				{#each data.leaderboard as e (e.userId)}
					{#if e.userId !== data.userId}
						<option value={e.userId} selected={e.userId === selected}>
							{e.avatar} {e.name} — {Math.round(e.accuracy * 100)}%
						</option>
					{/if}
				{/each}
			</select>
		</div>

		{#if data.target}
			<div class="space-y-6">
				<div class="flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3 text-sm">
					<span class="font-medium">{data.target.avatar} {data.target.name}</span>
					<a href="/nemesis" class="text-xs font-medium text-primary hover:underline">Or face your nemesis →</a>
				</div>
				<H2HLedger decks={data.h2h} empty={`No shared decks with ${data.target.name} yet — study together first.`} />
				<div>
					<SectionHeader icon={Swords} title="Card-by-card duels" />
					<Card class="divide-y">
						{#if data.duels.length === 0}
							<p class="p-6 text-center text-sm text-muted-foreground">No shared cards yet.</p>
						{:else}
							{#each data.duels as duel (duel.cardId)}
								<DuelRow myCorrect={duel.myCorrect} myTotal={duel.myTotal} theirCorrect={duel.theirCorrect} theirTotal={duel.theirTotal}>
									{cardDuelLine({
										front: duel.front.slice(0, 80) + (duel.front.length > 80 ? '…' : ''),
										myCorrect: duel.myCorrect,
										myTotal: duel.myTotal,
										theirCorrect: duel.theirCorrect,
										theirTotal: duel.theirTotal
									})}
								</DuelRow>
							{/each}
						{/if}
					</Card>
				</div>
			</div>
		{/if}
	</section>
</div>
