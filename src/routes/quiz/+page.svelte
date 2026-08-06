<script>
	import { PenLine, Clock3 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';

	let { data } = $props();
</script>

<div class="space-y-8 pt-8">
	<div>
		<div class="flex items-center gap-2">
			<PenLine class="size-5 text-primary" />
			<h1 class="text-3xl font-bold tracking-tight">Quizzes</h1>
		</div>
		<p class="mt-1 text-muted-foreground">
			Timed MCQ sprints. Every answer is scored against the room and your rival.
		</p>
	</div>
	<div class="grid gap-4 sm:grid-cols-2">
		{#each data.quizzes as quiz (quiz.id)}
			<Card class="flex flex-col p-5 transition-shadow hover:shadow-md">
				<div class="mb-2 text-2xl">{quiz.emoji}</div>
				<h2 class="font-semibold">{quiz.title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{quiz.description}</p>
				<div class="mt-3 flex items-center justify-between text-xs text-muted-foreground">
					<span>{quiz.questions.length} questions</span>
					<span class="inline-flex items-center gap-1"><Clock3 class="size-3.5" /> {quiz.minutes} min</span>
				</div>
				<a href={`/quiz/${quiz.id}`} class="mt-4">
					<Button variant="outline" class="w-full">Start quiz</Button>
				</a>
			</Card>
		{/each}
	</div>
</div>
