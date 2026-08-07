<script>
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Target, Swords, Users, Search, Plus } from 'lucide-svelte';
	import DuelRow from '$lib/components/DuelRow.svelte';
	import H2HLedger from '$lib/components/H2HLedger.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { cardDuelLine } from '$lib/engine/nemesis.js';

	let { data } = $props();

	const GROUP_EMOJIS = ['👥', '📚', '⚔️', '🏛️', '🧠', '🔥', '🎯', '🌏'];

	// ---- Groups ----
	let groupQuery = $state('');
	let newGroupName = $state('');
	let newGroupEmoji = $state('👥');
	let newGroupDesc = $state('');
	let groupBusy = $state(false);
	let expandedGroup = $state(null);

	const visibleGroups = $derived(
		groupQuery.trim()
			? data.groups.filter((g) => g.name.toLowerCase().includes(groupQuery.trim().toLowerCase()))
			: data.groups
	);

	async function createGroup() {
		if (groupBusy || newGroupName.trim().length < 2) return;
		groupBusy = true;
		try {
			const r = await fetch('/api/groups', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: newGroupName, emoji: newGroupEmoji, description: newGroupDesc })
			});
			const j = await r.json();
			if (!r.ok) throw new Error(j.error ?? 'Could not create group');
			newGroupName = '';
			newGroupDesc = '';
			toast.success('Group created');
			await invalidateAll();
		} catch (err) {
			toast.error(err.message);
		}
		groupBusy = false;
	}

	async function toggleMembership(group, join) {
		try {
			const r = await fetch(join ? '/api/groups/join' : '/api/groups/leave', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ groupId: group.id })
			});
			const j = await r.json();
			if (!r.ok) throw new Error(j.error ?? 'Something went wrong');
			toast.success(join ? `Joined ${group.name}` : `Left ${group.name}`);
			await invalidateAll();
		} catch (err) {
			toast.error(err.message);
		}
	}

	// ---- Students ----
	let userQuery = $state('');
	const visibleUsers = $derived(
		userQuery.trim()
			? data.users.filter((u) => u.name.toLowerCase().includes(userQuery.trim().toLowerCase()))
			: data.users.slice(0, 12)
	);

	function challenge(id) {
		if (id) goto(`/colab?student=${id}`, { invalidateAll: true });
	}

	function myRate(d) {
		return d.total === 0 ? 0 : d.correct / d.total;
	}
</script>

<div class="space-y-8 pt-6">
	<header class="border-b border-border pb-5">
		<p class="eyebrow text-primary">Classroom</p>
		<h1 class="font-display mt-1.5 text-3xl font-semibold tracking-tight text-foreground">Colab</h1>
		<p class="mt-1 max-w-xl text-sm text-muted-foreground">
			Study groups, classmates, and the head-to-head ledger. Find your people, then decide who to catch.
		</p>
	</header>

	<!-- Position stats -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<Stat label="Your rank" value={data.leaderboard.length > 0 ? `#${data.myRank}` : '—'} sub={`of ${data.leaderboard.length} students`} />
		<Stat
			label="Gap to first"
			value={data.top ? `${Math.round((data.top.accuracy - (data.me?.accuracy ?? 0)) * 100)}%` : '—'}
			sub={data.top?.name ?? 'No one yet'}
			tone={data.top && data.top.userId === data.userId ? 'success' : ''}
		/>
		<Stat label="Ahead of you" value={Math.max(0, data.myRank - 1)} sub="students to overtake" />
		{#if data.me}
			<Stat label="Your accuracy" value={`${Math.round(data.me.accuracy * 100)}%`} sub={`${data.me.reviews} reviews`} />
		{/if}
	</div>

	<!-- Study groups -->
	<section class="space-y-4">
		<SectionHeader icon={Users} title="Study groups" />
		<Card class="p-4 border-border">
			<p class="eyebrow mb-2 text-muted-foreground">Create a group</p>
			<div class="flex flex-col gap-2">
				<div class="flex gap-2">
					<Input bind:value={newGroupName} placeholder="Group name, e.g. Polity Sprint" maxlength="40" aria-label="Group name" />
					<Button onclick={createGroup} disabled={groupBusy || newGroupName.trim().length < 2} class="shrink-0">
						<Plus class="size-4" /> Create
					</Button>
				</div>
				<div class="flex flex-wrap items-center gap-1.5">
					{#each GROUP_EMOJIS as e (e)}
						<button
							onclick={() => (newGroupEmoji = e)}
							class="flex h-8 w-8 items-center justify-center rounded-md border text-base transition-colors {newGroupEmoji === e ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'}"
							aria-label={`Emoji ${e}`}
						>{e}</button>
					{/each}
					<Input bind:value={newGroupDesc} placeholder="What's it about? (optional)" maxlength="120" class="h-8 flex-1 min-w-40" aria-label="Group description" />
				</div>
			</div>
		</Card>

		<div class="relative">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input bind:value={groupQuery} placeholder="Search groups…" class="pl-9" aria-label="Search groups" />
		</div>

		{#if visibleGroups.length === 0}
			<p class="py-6 text-center text-sm text-muted-foreground">No groups yet — create the first one.</p>
		{:else}
			<div class="space-y-2">
				{#each visibleGroups as g (g.id)}
					<Card class="p-4 border-border">
						<div class="flex items-center justify-between gap-3">
							<div class="flex min-w-0 items-center gap-3">
								<span class="text-xl leading-none">{g.emoji}</span>
								<div class="min-w-0">
									<p class="truncate font-medium flex items-center gap-2 text-foreground">
										<span>{g.name}</span>
										{#if g.isMember}<Badge variant="secondary" class="font-mono text-[10px] text-primary">Member</Badge>{/if}
									</p>
									<p class="truncate text-xs text-muted-foreground">
										<span class="font-mono">{g.memberCount}</span> {g.memberCount === 1 ? 'member' : 'members'}
										{#if g.description} · {g.description}{/if}
									</p>
								</div>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								{#if g.isMember}
									<button
										onclick={() => (expandedGroup = expandedGroup === g.id ? null : g.id)}
										class="text-xs font-medium text-muted-foreground hover:text-foreground"
									>{expandedGroup === g.id ? 'Hide members' : 'Members'}</button>
									<Button variant="outline" size="sm" onclick={() => toggleMembership(g, false)}>Leave</Button>
								{:else}
									<Button size="sm" onclick={() => toggleMembership(g, true)}>Join</Button>
								{/if}
							</div>
						</div>
						{#if g.isMember && expandedGroup === g.id}
							{@const detail = data.myGroupDetails.find((d) => d?.id === g.id)}
							{#if detail}
								<div class="mt-3 border-t border-border pt-3">
									{#if detail.members.length === 0}
										<p class="text-sm text-muted-foreground">Just you so far.</p>
									{:else}
										<div class="space-y-1.5">
											{#each detail.members as m (m.userId)}
												<div class="flex items-center justify-between text-sm">
													<span class="min-w-0 truncate text-foreground">
														{m.avatar} {m.name}
														{#if m.userId === data.userId}<span class="text-muted-foreground"> (you)</span>{/if}
													</span>
													<span class="font-mono text-xs text-muted-foreground">{Math.round(m.accuracy * 100)}% · {m.reviews} reviews</span>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						{/if}
					</Card>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Find students -->
	<section class="space-y-4">
		<SectionHeader icon={Search} title="Find students" />
		<div class="relative">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input bind:value={userQuery} placeholder="Search classmates by name…" class="pl-9" aria-label="Search students" />
		</div>
		{#if visibleUsers.length === 0}
			<p class="py-6 text-center text-sm text-muted-foreground">No one by that name yet.</p>
		{:else}
			<div class="grid gap-2 sm:grid-cols-2">
				{#each visibleUsers as u (u.id)}
					<Card class="flex items-center justify-between gap-3 p-3 border-border">
						<div class="flex min-w-0 items-center gap-2.5">
							<span class="text-lg">{u.avatar}</span>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium text-foreground">
									{u.name}
									{#if u.id === data.userId}<span class="text-muted-foreground"> (you)</span>{/if}
								</p>
								<p class="font-mono text-xs text-muted-foreground">{u.accuracy == null ? 'No reviews yet' : `${Math.round(u.accuracy * 100)}% · ${u.reviews} reviews`}</p>
							</div>
						</div>
						{#if u.id !== data.userId}
							<Button variant="outline" size="sm" onclick={() => challenge(u.id)} class="shrink-0">Compare</Button>
						{/if}
					</Card>
				{/each}
			</div>
		{/if}
	</section>

	<!-- You vs the room per deck -->
	<section>
		<SectionHeader icon={Target} title="You vs the room" />
		<Card class="divide-y divide-border border-border">
			{#each data.perDeck as d (d.deckId)}
				<div class="p-4">
					<div class="flex items-center justify-between text-sm">
						<span class="font-medium text-foreground">{d.emoji} {d.title}</span>
						<span class="text-xs text-muted-foreground">
							<span class="font-mono font-semibold text-foreground">{Math.round(myRate(d) * 100)}%</span> vs room
							<span class="font-mono font-semibold text-foreground"> {data.room[d.deckId] == null ? '—' : `${Math.round(data.room[d.deckId] * 100)}%`}</span>
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

	<!-- Challenge ledger -->
	{#if data.target}
		<section>
			<SectionHeader icon={Swords} title={`Head-to-head with ${data.target.name}`} />
			<div class="space-y-6">
				<div class="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">
					<span class="font-medium text-foreground">{data.target.avatar} {data.target.name}</span>
					<a href="/nemesis" class="text-xs font-medium text-primary hover:underline">Or face your nemesis →</a>
				</div>
				<H2HLedger decks={data.h2h} empty={`No shared decks with ${data.target.name} yet — study together first.`} />
				<div>
					<SectionHeader icon={Swords} title="Card-by-card duels" />
					<Card class="divide-y divide-border border-border">
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
		</section>
	{/if}
</div>
