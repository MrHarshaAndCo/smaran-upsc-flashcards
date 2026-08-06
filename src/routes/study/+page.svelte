<script lang="ts">
	import { GraduationCap, ArrowRight, BookOpen, Layers } from 'lucide-svelte';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
</script>

<div class="space-y-6 pt-6 mx-auto max-w-4xl">
	<header class="border-b border-border pb-5">
		<div class="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
			<GraduationCap class="size-4" />
			<span>Subject Study Hub</span>
		</div>
		<h1 class="font-display mt-1.5 text-3xl font-semibold tracking-tight">Study Sets</h1>
		<p class="mt-1 text-sm text-muted-foreground">Select a subject deck to start an interactive MCQ quiz practice session.</p>
	</header>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each data.decks as deck (deck.id)}
			<Card class="flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-sm">
				<CardHeader>
					<div class="flex items-center justify-between">
						<span class="text-2xl">{deck.emoji}</span>
						<span class="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
							{deck.cardCount} questions
						</span>
					</div>
					<CardTitle class="text-xl mt-3">{deck.title}</CardTitle>
					<CardDescription class="text-xs">{deck.subtitle}</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<p class="text-xs text-muted-foreground leading-relaxed">{deck.blurb}</p>
					<div class="pt-2">
						<a href={`/study/${deck.id}`} class="w-full">
							<Button class="w-full gap-2">
								<span>Start MCQ Quiz</span>
								<ArrowRight class="size-4" />
							</Button>
						</a>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
