<script lang="ts">
	import { BarChart3, Clock, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';

	interface TopicStat {
		subject: string;
		subTopic: string;
		total: number;
		correct: number;
		accuracy: number; // 0..1
		avgTimeSec: number;
		hesitantCount: number;
	}

	let {
		topicStats = []
	}: {
		topicStats: TopicStat[];
	} = $props();

	function getAccuracyTone(accuracy: number): string {
		if (accuracy >= 0.8) return 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400';
		if (accuracy >= 0.5) return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400';
		return 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400';
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<BarChart3 class="size-4 text-primary" />
			<h3 class="font-display text-base font-semibold tracking-tight">Sub-Topic Mastery & Hesitation Heatmap</h3>
		</div>
		<span class="text-xs text-muted-foreground">{topicStats.length} sub-topics tracked</span>
	</div>

	{#if topicStats.length === 0}
		<Card class="p-6 text-center text-xs text-muted-foreground space-y-2">
			<p>No sub-topic quiz attempts recorded yet.</p>
			<p>Complete quiz rounds to populate your subject mastery matrix!</p>
		</Card>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{#each topicStats as stat (stat.subTopic)}
				<Card class="p-4 border border-border/80 bg-card space-y-3 shadow-xs">
					<div class="flex items-start justify-between">
						<div class="space-y-0.5 min-w-0">
							<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">{stat.subject}</span>
							<h4 class="font-semibold text-sm truncate">{stat.subTopic}</h4>
						</div>

						<span class="rounded-full px-2.5 py-0.5 font-mono text-xs font-bold border {getAccuracyTone(stat.accuracy)}">
							{Math.round(stat.accuracy * 100)}%
						</span>
					</div>

					<!-- Accuracy Bar -->
					<div class="space-y-1">
						<div class="flex justify-between text-[11px] text-muted-foreground">
							<span>Accuracy</span>
							<span>{stat.correct}/{stat.total} correct</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-full rounded-full transition-all {stat.accuracy >= 0.8 ? 'bg-green-500' : stat.accuracy >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}"
								style={`width: ${Math.round(stat.accuracy * 100)}%`}
							></div>
						</div>
					</div>

					<!-- Hesitation & Timing Details -->
					<div class="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
						<span class="flex items-center gap-1">
							<Clock class="size-3 text-primary" />
							<span>{stat.avgTimeSec}s / q</span>
						</span>

						{#if stat.hesitantCount > 0}
							<span class="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
								<AlertTriangle class="size-3" />
								<span>{stat.hesitantCount} hesitant</span>
							</span>
						{:else}
							<span class="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
								<CheckCircle2 class="size-3" />
								<span>Fluent Recall</span>
							</span>
						{/if}
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
