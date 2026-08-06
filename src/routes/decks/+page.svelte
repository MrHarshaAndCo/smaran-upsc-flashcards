<script>
	import { RotateCcw, Layers, ArrowRight, BookOpen } from 'lucide-svelte';
	import DeckCard from '$lib/components/DeckCard.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';

	let { data } = $props();

	const dueDecks = $derived(data.deckStats.filter((s) => s.due > 0));
	const unfinishedDecks = $derived(data.deckStats.filter((s) => s.newCards > 0));
</script>

<div class="space-y-8 pt-6">
	<header class="border-b border-border pb-5">
		<p class="eyebrow text-primary">Flashcards</p>
		<h1 class="font-display mt-1.5 text-3xl font-semibold tracking-tight">Flashcards</h1>
		<p class="mt-1 text-sm text-muted-foreground">Spaced repetition — cards you've seen come back just before you forget them.</p>
	</header>

	<div class="grid grid-cols-2 gap-3">
		<Stat label="Due for review" value={data.dueTotal} sub="cards the scheduler wants back" />
		<Stat label="Unfinished" value={data.newTotal} sub="cards you haven't touched" tone={data.newTotal > 0 ? 'primary' : ''} />
	</div>

	{#if dueDecks.length > 0}
		<section>
			<h2 class="font-display mb-3 text-xl font-semibold tracking-tight">Due now</h2>
			<Card class="divide-y">
				{#each dueDecks as s (s.deck.id)}
					<div class="flex items-center justify-between gap-3 p-4">
						<div class="flex min-w-0 items-center gap-3">
							<span class="text-xl">{s.deck.emoji}</span>
							<div class="min-w-0">
								<p class="truncate font-medium">{s.deck.title}</p>
								<p class="font-mono text-xs text-muted-foreground">{s.due} due · {s.newCards} new</p>
							</div>
						</div>
						<a href={`/study/${s.deck.id}`} class="shrink-0">
							<Button size="sm">
								<RotateCcw class="size-3.5" /> Review
							</Button>
						</a>
					</div>
				{/each}
			</Card>
		</section>
	{:else if data.dueTotal === 0 && data.userId}
		<div class="margin-rule flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
			<span class="text-lg">🌤️</span>
			<span>Nothing due right now — the pile is clear. <a href="/dashboard" class="font-medium text-primary hover:underline">See your dashboard</a> or pick a deck below.</span>
		</div>
	{/if}

	<section>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="font-display text-xl font-semibold tracking-tight">All decks</h2>
			<span class="font-mono text-xs text-muted-foreground">{unfinishedDecks.length} unfinished</span>
		</div>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.deckStats as s (s.deck.id)}
				<DeckCard {s} />
			{/each}
		</div>
	</section>

	<div class="flex justify-center pt-2">
		<a href="/quiz"><Button variant="outline" class="gap-2"><BookOpen class="size-4" /> Prefer MCQs? Practice a subject <ArrowRight class="size-3.5" /></Button></a>
	</div>
</div>
