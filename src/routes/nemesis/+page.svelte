<script lang="ts">
	import { Swords, Users, Shield, Sparkles } from 'lucide-svelte';
	import NemesisDossier from '$lib/components/NemesisDossier.svelte';
	import RivalBadges from '$lib/components/RivalBadges.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { cardDuelLine, h2hRecord } from '$lib/engine/nemesis.js';

	let { data } = $props();
</script>

<div class="mx-auto max-w-4xl space-y-8 pt-6">
	{#if !data.nemesis}
		<div class="py-16 text-center space-y-4">
			<Swords class="size-12 text-primary mx-auto opacity-50" />
			<h1 class="font-display text-3xl font-semibold tracking-tight text-foreground">No Rival Assigned Yet</h1>
			<p class="mx-auto max-w-md text-sm text-muted-foreground">
				Smaran pairs you with the student whose accuracy is closest to yours. Complete a few MCQ quiz rounds to set your score baseline.
			</p>
			<a href="/" class="inline-block pt-2"><Button size="lg">Take a Quiz</Button></a>
		</div>
	{:else}
		<header class="border-b border-border pb-5 flex items-center justify-between">
			<div>
				<div class="flex items-center gap-2">
					<Swords class="size-5 text-primary" />
					<h1 class="font-display text-3xl font-semibold tracking-tight text-foreground">Rivalry & Nemesis Intelligence</h1>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Head-to-head match analytics, subject battlegrounds, and rival recommendations.
				</p>
			</div>
			<a href="/leaderboard">
				<Button variant="outline" size="sm" class="gap-1 text-xs">
					<Users class="size-3.5" />
					<span>Leaderboard</span>
				</Button>
			</a>
		</header>

		<!-- Main Nemesis Dossier Component -->
		<NemesisDossier
			nemesis={data.nemesis.nemesis}
			record={data.nemesis.record}
			taunt={data.nemesis.taunt}
			recommendations={data.nemesis.recommendations}
		/>

		<!-- Rivalry Badges & Challenge Link -->
		<RivalBadges
			streak={data.nemesis.myStreak}
			wins={data.nemesis.record.win}
			accuracyPct={Math.round((data.nemesis.nemesis?.accuracy ?? 0.75) * 100)}
			user={data.user}
		/>

		<!-- Deck Battleground Ledger -->
		<section class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="font-display text-xl font-semibold tracking-tight flex items-center gap-2 text-foreground">
					<Shield class="size-4 text-primary" />
					<span>Subject Ledger Breakdown</span>
				</h2>
				<span class="text-xs text-muted-foreground">{data.nemesis.decks.length} shared subject decks</span>
			</div>

			<Card class="divide-y border-border/80">
				{#each data.nemesis.decks as d (d.deckId)}
					{@const r = h2hRecord({ myCorrect: d.myCorrect, myTotal: d.myTotal, theirCorrect: d.theirCorrect, theirTotal: d.theirTotal })}
					<div class="flex items-center justify-between p-4 text-xs hover:bg-muted/30 transition-colors">
						<span class="font-medium text-sm flex items-center gap-2 text-foreground">
							<span>{d.emoji}</span>
							<span>{d.deckTitle}</span>
						</span>
						<div class="flex items-center gap-4">
							<span class="font-mono text-muted-foreground">
								You: <strong class="text-foreground">{d.myCorrect}/{d.myTotal}</strong> vs Rival: <strong class="text-foreground">{d.theirCorrect}/{d.theirTotal}</strong>
							</span>
							<Badge variant={r.outcome === 'win' ? 'success' : r.outcome === 'loss' ? 'destructive' : 'secondary'} class="font-medium text-[11px]">
								{r.outcome === 'win' ? 'You lead' : r.outcome === 'loss' ? 'Rival leads' : 'Even'}
							</Badge>
						</div>
					</div>
				{/each}
			</Card>
		</section>

		<!-- Recommended Rivals Section -->
		{#if data.nemesis.recommendations?.rivalCandidates?.length}
			<section class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="font-display text-xl font-semibold tracking-tight flex items-center gap-2 text-foreground">
						<Sparkles class="size-4 text-primary" />
						<span>Alternative Rival Recommendations</span>
					</h2>
					<span class="text-xs text-muted-foreground">Based on your accuracy baseline</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each data.nemesis.recommendations.rivalCandidates as candidate (candidate.userId)}
						<Card class="p-4 flex items-center justify-between shadow-xs border-border">
							<div class="space-y-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-lg">{candidate.avatar}</span>
									<span class="font-semibold text-sm truncate text-foreground">{candidate.name}</span>
								</div>
								<p class="text-[11px] text-muted-foreground">
									{Math.round(candidate.accuracy * 100)}% accuracy · {candidate.statusLine}
								</p>
							</div>
							<div class="text-right shrink-0 ml-2">
								<Badge variant="secondary" class="font-mono text-[10px] font-bold text-primary">
									{candidate.matchPercentage}% Match
								</Badge>
							</div>
						</Card>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Card-by-Card Duels -->
		<section class="space-y-4">
			<h2 class="font-display text-xl font-semibold tracking-tight text-foreground">Question-by-Question Ledger</h2>
			<Card class="divide-y border-border/80">
				{#if data.duels.length === 0}
					<p class="p-6 text-center text-xs text-muted-foreground">
						No shared question attempts yet — take more quizzes to open the detailed question ledger.
					</p>
				{:else}
					{#each data.duels as duel (duel.cardId)}
						{@const win = duel.myCorrect / duel.myTotal > duel.theirCorrect / duel.theirTotal}
						{@const loss = duel.myCorrect / duel.myTotal < duel.theirCorrect / duel.theirTotal}
						<div class="flex items-center gap-3 p-3.5 text-xs hover:bg-muted/20 transition-colors">
							<span class={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${win ? 'bg-success/15 text-success' : loss ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'}`}>
								{win ? '✓' : loss ? '✗' : '='}
							</span>
							<p class="text-xs text-foreground font-medium">
								{cardDuelLine({
									front: duel.front.slice(0, 90) + (duel.front.length > 90 ? '…' : ''),
									myCorrect: duel.myCorrect,
									myTotal: duel.myTotal,
									theirCorrect: duel.theirCorrect,
									theirTotal: duel.theirTotal
								})}
							</p>
						</div>
					{/each}
				{/if}
			</Card>
		</section>
	{/if}
</div>
