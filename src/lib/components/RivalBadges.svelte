<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Trophy, Share2, Check } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	interface BadgeItem {
		id: string;
		title: string;
		description: string;
		icon: string;
		unlocked: boolean;
		progressText?: string;
	}

	let {
		streak = 0,
		wins = 0,
		accuracyPct = 0,
		user = null
	}: {
		streak?: number;
		wins?: number;
		accuracyPct?: number;
		user?: any;
	} = $props();

	let copied = $state(false);

	const badges: BadgeItem[] = $derived([
		{
			id: 'giant-slayer',
			title: 'Giant Slayer',
			description: 'Defeat your rival in a Quiz session with >80% accuracy',
			icon: '⚔️',
			unlocked: wins > 0 && accuracyPct >= 80,
			progressText: wins > 0 && accuracyPct >= 80 ? 'Unlocked' : 'Requires >80% win'
		},
		{
			id: 'polity-master',
			title: 'Polity Vanguard',
			description: 'Maintain 75%+ accuracy in Indian Polity quizzes',
			icon: '🏛️',
			unlocked: accuracyPct >= 75,
			progressText: `${accuracyPct}% / 75%`
		},
		{
			id: 'streak-demon',
			title: 'Streak Demon',
			description: 'Maintain a 5+ day study streak',
			icon: '🔥',
			unlocked: streak >= 5,
			progressText: `${streak} / 5 Days`
		},
		{
			id: 'clutch-master',
			title: 'Prelims Qualifier',
			description: 'Clear the Prelims Mock Cutoff (>95 marks)',
			icon: '🏆',
			unlocked: accuracyPct >= 85,
			progressText: accuracyPct >= 85 ? 'Cutoff Cleared' : 'In Progress'
		}
	]);

	function copyChallengeLink() {
		const origin = typeof window !== 'undefined' ? window.location.origin : '';
		const link = `${origin}/?challenge=true&ref=${user?.name ?? 'aspirant'}`;
		navigator.clipboard.writeText(link);
		copied = true;
		toast.success('Challenge link copied to clipboard!', {
			description: 'Share this link with fellow aspirants to challenge them.'
		});
		setTimeout(() => (copied = false), 2500);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Trophy class="size-4 text-warning" />
			<h3 class="font-display text-base font-semibold tracking-tight text-foreground">Rivalry Badges & Achievements</h3>
		</div>

		<Button variant="outline" size="sm" onclick={copyChallengeLink} class="gap-1.5 text-xs">
			{#if copied}
				<Check class="size-3.5 text-success" />
				<span class="text-success">Copied Link</span>
			{:else}
				<Share2 class="size-3.5 text-primary" />
				<span>Challenge Friend</span>
			{/if}
		</Button>
	</div>

	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		{#each badges as b (b.id)}
			<Card class="p-3 border text-center space-y-1.5 transition-all {b.unlocked ? 'border-warning/40 bg-warning/10 text-foreground shadow-xs' : 'border-border/40 bg-card opacity-50'}">
				<span class="text-2xl">{b.icon}</span>
				<h4 class="font-bold text-xs">{b.title}</h4>
				<p class="text-[10px] text-muted-foreground leading-tight line-clamp-2">{b.description}</p>
				<Badge variant="outline" class="font-mono text-[9px] font-semibold text-muted-foreground">
					{b.progressText}
				</Badge>
			</Card>
		{/each}
	</div>
</div>
