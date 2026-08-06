<script>
	import { Flame, LineChart, BookOpen, ArrowRight } from 'lucide-svelte';
	import QuickQuiz from '$lib/components/QuickQuiz.svelte';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
</script>

<div class="mx-auto max-w-xl space-y-8 pt-6">
	<!-- Streak / context strip -->
	<div class="flex items-center justify-between">
		<div>
			<p class="text-sm font-medium text-primary">Quick Quiz</p>
			<p class="text-xs text-muted-foreground">All quizzes merged · random every round</p>
		</div>
		{#if data.summary}
			<div class="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm">
				<Flame class="size-4 text-orange-500" />
				<span class="font-semibold">{data.summary.streak}</span>
				<span class="text-xs text-muted-foreground">day streak</span>
			</div>
		{/if}
	</div>

	<QuickQuiz
		questions={data.pool}
		quizId="quick"
		emoji="⚡"
		title="Mixed Grand Test"
		perRound={10}
		nemesisStats={data.nemesisStats}
		nemesisName={data.nemesisName}
		userName={data.userName}
	/>

	{#if data.nemesis}
		<div class="flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3 text-sm">
			<div class="flex items-center gap-2 text-muted-foreground">
				<span>{data.nemesis.avatar}</span>
				<span>
					<span class="font-medium text-foreground">{data.nemesis.name}</span> is at {Math.round(data.nemesis.accuracy * 100)}%
				</span>
			</div>
			<a href="/nemesis" class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
				Rival dossier <ArrowRight class="size-3.5" />
			</a>
		</div>
	{/if}

	<!-- Secondary navigation shortcuts -->
	<div class="grid grid-cols-2 gap-3">
		<a href="/decks">
			<Button variant="outline" class="h-14 w-full justify-start gap-2.5">
				<BookOpen class="size-4 text-muted-foreground" />
				<span class="text-left">
					<span class="block text-sm font-semibold">Flashcards</span>
					<span class="block text-xs font-normal text-muted-foreground">{data.decks.length} decks · spaced repetition</span>
				</span>
			</Button>
		</a>
		<a href="/dashboard">
			<Button variant="outline" class="h-14 w-full justify-start gap-2.5">
				<LineChart class="size-4 text-muted-foreground" />
				<span class="text-left">
					<span class="block text-sm font-semibold">Dashboard</span>
					<span class="block text-xs font-normal text-muted-foreground">radar · streaks · sessions</span>
				</span>
			</Button>
		</a>
	</div>
</div>
