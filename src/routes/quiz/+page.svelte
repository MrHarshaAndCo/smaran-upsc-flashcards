<script>
	import { Button } from '$lib/components/ui/button/index.js';

	let { data } = $props();
</script>

<div class="wrap" style="padding-top: 40px">
	<p class="eyebrow">Quiz hall</p>
	<h1 style="margin-bottom: 6px">Quizzes</h1>
	<p class="muted" style="max-width: 56ch">
		Timed MCQ sprints. Every answer is scored against the room and your rival, so you always
		know where you stand.
	</p>

	<div class="deck-grid section" style="margin-top: 28px">
		{#each data.quizzes as quiz (quiz.id)}
			<div class="deck-tile" style="--deck-color: {quiz.color}">
				<div class="emoji">{quiz.emoji}</div>
				<div>
					<h3>{quiz.title}</h3>
					<div class="sub">{quiz.description}</div>
				</div>
				<div class="meta">
					<span>{quiz.questions.length} questions</span>
					<span>{quiz.minutes} min</span>
				</div>
				<div style="margin-top: 4px">
					<a href={`/quiz/${quiz.id}`}>
						<Button variant="outline" size="sm" class="w-full">Start quiz</Button>
					</a>
				</div>
			</div>
		{/each}
	</div>
</div>
