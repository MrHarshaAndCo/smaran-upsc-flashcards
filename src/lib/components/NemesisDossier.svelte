<script lang="ts">
	import { Card } from '$lib/components/ui/card';
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

<Card class="border-border/80 bg-slate-950 p-6 text-slate-100 shadow-md space-y-5">
	<div class="flex items-start justify-between">
		<div>
			<div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-400">
				<Trophy class="size-3.5" />
				<span>Nemesis Rival Dossier</span>
			</div>
			<h2 class="mt-1 text-2xl font-bold tracking-tight">{nemesis.avatar} {nemesis.name}</h2>
			{#if !compact}
				<p class="mt-1 text-xs text-slate-400">
					{Math.round(nemesis.accuracy * 100)}% rival accuracy · {nemesis.reviews} total reviews
				</p>
			{/if}
		</div>
		<span class="rounded-full border border-orange-400/60 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-400">
			Active Nemesis
		</span>
	</div>

	<!-- Score Record Bar -->
	<div class="grid grid-cols-3 gap-2">
		<div class="rounded-xl bg-slate-900/90 border border-slate-800 p-3 text-center">
			<p class="text-2xl font-bold text-green-400">{record.win}</p>
			<p class="text-[10px] uppercase tracking-wide text-slate-400 font-medium">You lead</p>
		</div>
		<div class="rounded-xl bg-slate-900/90 border border-slate-800 p-3 text-center">
			<p class="text-2xl font-bold text-red-400">{record.loss}</p>
			<p class="text-[10px] uppercase tracking-wide text-slate-400 font-medium">They lead</p>
		</div>
		<div class="rounded-xl bg-slate-900/90 border border-slate-800 p-3 text-center">
			<p class="text-2xl font-bold text-slate-300">{record.draw}</p>
			<p class="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Dead even</p>
		</div>
	</div>

	<!-- Taunt Line -->
	<p class="border-l-2 border-orange-400 bg-slate-900/50 p-3 rounded-r-lg text-xs italic text-slate-300 leading-relaxed">
		“{taunt}”
	</p>

	<!-- Smart Rival Recommendations Section -->
	{#if recommendations && !compact}
		<div class="pt-3 border-t border-slate-800/80 space-y-3">
			<div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
				<Sparkles class="size-3.5 text-orange-400" />
				<span class="text-orange-400">Rival Battleground Recommendations</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
				{#if recommendations.targetSubject}
					<div class="rounded-lg border border-orange-500/30 bg-orange-950/20 p-2.5 space-y-1">
						<div class="flex items-center gap-1 text-[11px] font-semibold text-orange-400">
							<Target class="size-3" />
							<span>Target to Reclaim</span>
						</div>
						<p class="font-medium text-slate-200">{recommendations.targetSubject.emoji} {recommendations.targetSubject.deckTitle}</p>
						<p class="text-[10px] text-slate-400">Gap: {Math.round(Math.abs(recommendations.targetSubject.gap) * 100)}%</p>
					</div>
				{/if}

				{#if recommendations.attackSubject}
					<div class="rounded-lg border border-green-500/30 bg-green-950/20 p-2.5 space-y-1">
						<div class="flex items-center gap-1 text-[11px] font-semibold text-green-400">
							<Zap class="size-3" />
							<span>Rival Vulnerability</span>
						</div>
						<p class="font-medium text-slate-200">{recommendations.attackSubject.emoji} {recommendations.attackSubject.deckTitle}</p>
						<p class="text-[10px] text-slate-400">Rival accuracy: {Math.round(recommendations.attackSubject.theirAccuracy * 100)}%</p>
					</div>
				{/if}

				{#if recommendations.defenseSubject}
					<div class="rounded-lg border border-red-500/30 bg-red-950/20 p-2.5 space-y-1">
						<div class="flex items-center gap-1 text-[11px] font-semibold text-red-400">
							<ShieldAlert class="size-3" />
							<span>Rival Stronghold</span>
						</div>
						<p class="font-medium text-slate-200">{recommendations.defenseSubject.emoji} {recommendations.defenseSubject.deckTitle}</p>
						<p class="text-[10px] text-slate-400">Rival accuracy: {Math.round(recommendations.defenseSubject.theirAccuracy * 100)}%</p>
					</div>
				{/if}
			</div>

			<!-- Actionable Insights List -->
			<div class="space-y-1.5 pt-1">
				{#each recommendations.insights as insight}
					<p class="text-[11px] text-slate-300 leading-normal flex items-start gap-1.5">
						<span>•</span>
						<span>{insight}</span>
					</p>
				{/each}
			</div>
		</div>
	{/if}
</Card>
