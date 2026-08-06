<script>
	import { GraduationCap } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
</script>

<div class="space-y-6 pt-6">
	<header class="border-b border-border pb-5">
		<p class="eyebrow text-primary">Study</p>
		<h1 class="font-display mt-1.5 text-3xl font-semibold tracking-tight">Study</h1>
		<p class="mt-1 text-sm text-muted-foreground">Focused practice, topic by topic.</p>
	</header>

	<Card class="flex flex-col items-center gap-3 px-6 py-16 text-center">
		<GraduationCap class="size-10 text-muted-foreground/50" />
		<p class="font-display text-xl font-semibold tracking-tight">Nothing here yet</p>
		<p class="max-w-sm text-sm text-muted-foreground">Subject-wise practice and review decks will land here. Meanwhile, hit Quiz for a quick round or Flashcard for spaced repetition.</p>
	</Card>
</div>
