<script lang="ts">
	import { BarChart3, Clock, AlertTriangle, CheckCircle2 } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	interface TopicStat {
		subject: string;
		subTopic: string;
		total: number;
		correct: number;
		accuracy: number;
		avgTimeSec: number;
		hesitantCount: number;
	}

	let {
		topicStats = []
	}: {
		topicStats: TopicStat[];
	} = $props();

	function getAccuracyVariant(accuracy: number): 'success' | 'warning' | 'destructive' {
		if (accuracy >= 0.8) return 'success';
		if (accuracy >= 0.5) return 'warning';
		return 'destructive';
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<BarChart3 class="size-4 text-primary" />
			<h3 class="font-display text-base font-semibold tracking-tight text-foreground">Sub-Topic Mastery & Hesitation Heatmap</h3>
		</div>
		<Badge variant="outline" class="text-xs text-muted-foreground">{topicStats.length} sub-topics tracked</Badge>
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
							<h4 class="font-semibold text-sm truncate text-foreground">{stat.subTopic}</h4>
						</div>

						<Badge variant={getAccuracyVariant(stat.accuracy)} class="font-mono text-xs font-bold">
							{Math.round(stat.accuracy * 100)}%
						</Badge>
					</div>

					<!-- Accuracy Bar -->
					<div class="space-y-1">
						<div class="flex justify-between text-[11px] text-muted-foreground">
							<span>Accuracy</span>
							<span>{stat.correct}/{stat.total} correct</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-full rounded-full transition-all {stat.accuracy >= 0.8 ? 'bg-success' : stat.accuracy >= 0.5 ? 'bg-warning' : 'bg-destructive'}"
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
							<span class="flex items-center gap-1 text-warning font-medium">
								<AlertTriangle class="size-3" />
								<span>{stat.hesitantCount} hesitant</span>
							</span>
						{:else}
							<span class="flex items-center gap-1 text-success font-medium">
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
