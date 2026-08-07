<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Target, Zap, ShieldAlert, Sparkles, Trophy } from 'lucide-svelte';

	interface LeaderEntry {
		userId: string;
		name: string;
		avatar: string;
		accuracy: number;
		reviews: number;
	}

	interface SubjectComparison {
		deckId: string;
		deckTitle: string;
		emoji: string;
		myAccuracy: number;
		theirAccuracy: number;
		gap: number;
		status: string;
	}

	interface NemesisRecommendation {
		targetSubject: SubjectComparison | null;
		attackSubject: SubjectComparison | null;
		defenseSubject: SubjectComparison | null;
		insights: string[];
	}

	let {
		nemesis,
		record,
		taunt,
		recommendations = null,
		compact = false
	}: {
		nemesis: LeaderEntry;
		record: { win: number; loss: number; draw: number };
		taunt: string;
		recommendations?: NemesisRecommendation | null;
		compact?: boolean;
	} = $props();
</script>

<Card class="border-border bg-card p-6 text-card-foreground shadow-md space-y-5">
	<div class="flex items-start justify-between">
		<div>
			<div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warning">
				<Trophy class="size-3.5" />
				<span>Nemesis Rival Dossier</span>
			</div>
			<h2 class="mt-1 text-2xl font-bold tracking-tight text-foreground">{nemesis.avatar} {nemesis.name}</h2>
			{#if !compact}
				<p class="mt-1 text-xs text-muted-foreground">
					{Math.round(nemesis.accuracy * 100)}% rival accuracy · {nemesis.reviews} total reviews
				</p>
			{/if}
		</div>
		<Badge variant="warning" class="uppercase tracking-widest font-bold text-[10px]">
			Active Nemesis
		</Badge>
	</div>

	<!-- Score Record Bar -->
	<div class="grid grid-cols-3 gap-2">
		<div class="rounded-xl bg-muted/60 border border-border p-3 text-center">
			<p class="text-2xl font-bold text-success">{record.win}</p>
			<p class="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">You lead</p>
		</div>
		<div class="rounded-xl bg-muted/60 border border-border p-3 text-center">
			<p class="text-2xl font-bold text-destructive">{record.loss}</p>
			<p class="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">They lead</p>
		</div>
		<div class="rounded-xl bg-muted/60 border border-border p-3 text-center">
			<p class="text-2xl font-bold text-muted-foreground">{record.draw}</p>
			<p class="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Dead even</p>
		</div>
	</div>

	<!-- Taunt Line -->
	<p class="border-l-2 border-warning bg-muted/40 p-3 rounded-r-lg text-xs italic text-foreground leading-relaxed">
		“{taunt}”
	</p>

	<!-- Smart Rival Recommendations Section -->
	{#if recommendations && !compact}
		<div class="pt-3 border-t border-border space-y-3">
			<div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warning">
				<Sparkles class="size-3.5 text-warning" />
				<span>Rival Battleground Recommendations</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
				{#if recommendations.targetSubject}
					<div class="rounded-lg border border-warning/30 bg-warning/10 p-2.5 space-y-1">
						<div class="flex items-center gap-1 text-[11px] font-semibold text-warning">
							<Target class="size-3" />
							<span>Target to Reclaim</span>
						</div>
						<p class="font-medium text-foreground">{recommendations.targetSubject.emoji} {recommendations.targetSubject.deckTitle}</p>
						<p class="text-[10px] text-muted-foreground">Gap: {Math.round(Math.abs(recommendations.targetSubject.gap) * 100)}%</p>
					</div>
				{/if}

				{#if recommendations.attackSubject}
					<div class="rounded-lg border border-success/30 bg-success/10 p-2.5 space-y-1">
						<div class="flex items-center gap-1 text-[11px] font-semibold text-success">
							<Zap class="size-3" />
							<span>Rival Vulnerability</span>
						</div>
						<p class="font-medium text-foreground">{recommendations.attackSubject.emoji} {recommendations.attackSubject.deckTitle}</p>
						<p class="text-[10px] text-muted-foreground">Rival accuracy: {Math.round(recommendations.attackSubject.theirAccuracy * 100)}%</p>
					</div>
				{/if}

				{#if recommendations.defenseSubject}
					<div class="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 space-y-1">
						<div class="flex items-center gap-1 text-[11px] font-semibold text-destructive">
							<ShieldAlert class="size-3" />
							<span>Rival Stronghold</span>
						</div>
						<p class="font-medium text-foreground">{recommendations.defenseSubject.emoji} {recommendations.defenseSubject.deckTitle}</p>
						<p class="text-[10px] text-muted-foreground">Rival accuracy: {Math.round(recommendations.defenseSubject.theirAccuracy * 100)}%</p>
					</div>
				{/if}
			</div>

			<!-- Actionable Insights List -->
			<div class="space-y-1.5 pt-1">
				{#each recommendations.insights as insight}
					<p class="text-[11px] text-muted-foreground leading-normal flex items-start gap-1.5">
						<span>•</span>
						<span>{insight}</span>
					</p>
				{/each}
			</div>
		</div>
	{/if}
</Card>
