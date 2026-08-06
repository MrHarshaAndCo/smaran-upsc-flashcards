<script>
	import { Flame, LineChart, BookOpen, ArrowRight } from 'lucide-svelte';
	import QuickQuiz from '$lib/components/QuickQuiz.svelte';

	let { data } = $props();
</script>

<div class="mx-auto max-w-xl space-y-8 pt-6">
	<header class="border-b border-border pb-5">
		<div class="flex items-end justify-between gap-4">
			<div>
				<p class="eyebrow text-muted-foreground">GENERAL STUDIES</p>
				<h1 class="font-display mt-1.5 text-3xl italic tracking-tight">Mixed Grand Test</h1>
				<p class="mt-1 text-sm text-muted-foreground">{data.questionTotal.toLocaleString('en-IN')} real Prelims questions · random every round</p>
			</div>
			{#if data.summary}
				<div class="flex shrink-0 flex-col items-center rounded-md border border-border bg-card px-3 py-2 text-center">
					<Flame class="size-4 text-primary" />
					<span class="font-mono text-xl font-semibold leading-tight omr-bubble">{data.summary.streak}</span>
					<span class="text-[10px] uppercase tracking-wide text-muted-foreground">day streak</span>
					{#if data.nemesisRecord}
						<span class="mt-1 font-mono text-[10px] text-muted-foreground">{data.nemesisRecord.wins}W {data.nemesisRecord.losses}L vs {data.nemesis?.name}</span>
					{/if}
				</div>
			{/if}
		</div>
	</header>

	<QuickQuiz
		questions={data.pool}
		quizId="quick"
		emoji="⚡"
		title="Round"
		perRound={10}
		nemesisStats={data.nemesisStats}
		nemesisName={data.nemesisName}
		nemesisUserId={data.nemesisUserId}
		userName={data.userName}
	/>

	{#if data.nemesis}
		<div class="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm">
			<div class="flex items-center gap-2 text-muted-foreground">
				<span>{data.nemesis.avatar}</span>
				<span>
					<span class="font-medium text-foreground">{data.nemesis.name}</span> is at <span class="font-mono">{Math.round(data.nemesis.accuracy * 100)}%</span>
				</span>
			</div>
			<a href="/nemesis" class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
				Rival dossier <ArrowRight class="size-3.5" />
			</a>
		</div>
	{/if}

	<div class="grid grid-cols-2 gap-3">
		<a href="/decks" class="flex items-center gap-2.5 rounded-md border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted/40">
			<BookOpen class="size-4 shrink-0 text-muted-foreground" />
			<span class="text-left">
				<span class="block text-sm font-semibold">Flashcards</span>
				<span class="block text-xs font-normal text-muted-foreground">{data.decks.length} decks · spaced repetition</span>
			</span>
		</a>
		<a href="/dashboard" class="flex items-center gap-2.5 rounded-md border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted/40">
			<LineChart class="size-4 shrink-0 text-muted-foreground" />
			<span class="text-left">
				<span class="block text-sm font-semibold">Dashboard</span>
				<span class="block text-xs font-normal text-muted-foreground">radar · streaks · sessions</span>
			</span>
		</a>
	</div>
</div>
