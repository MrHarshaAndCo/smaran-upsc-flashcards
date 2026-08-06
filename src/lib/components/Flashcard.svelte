<script lang="ts">
	import { CheckCircle2, XCircle, HelpCircle } from 'lucide-svelte';

	interface QuestionCard {
		id: string;
		question?: string;
		front?: string;
		back?: string;
		options?: string[];
		answerIndex?: number;
		correctIndex?: number;
		explanation?: string;
		hint?: string;
	}

	let {
		card,
		deck = null,
		onAnswer = null
	}: {
		card: QuestionCard;
		deck?: { emoji?: string; title?: string } | null;
		onAnswer?: ((correct: boolean, chosenIndex: number) => void) | null;
	} = $props();

	const questionText = $derived(card.question || card.front || '');
	const optionsList = $derived.by(() => {
		if (card.options && card.options.length > 0) return card.options;
		// If back text exists without explicit options array, derive distractor options
		return [
			card.back || 'Correct answer',
			'Option B - Secondary alternative',
			'Option C - Related constitutional provision',
			'Option D - None of the above'
		];
	});
	const correctIdx = $derived(card.correctIndex ?? card.answerIndex ?? 0);

	let selectedIndex = $state<number | null>(null);
	let answered = $state(false);

	$effect(() => {
		const _id = card.id;
		selectedIndex = null;
		answered = false;
	});

	const letters = ['A', 'B', 'C', 'D'];

	function handleSelect(index: number) {
		if (answered) return;
		selectedIndex = index;
		answered = true;
		const isCorrect = index === correctIdx;
		if (onAnswer) onAnswer(isCorrect, index);
	}

	function optionStyle(index: number) {
		if (!answered) return 'border-input bg-background hover:bg-muted/80 active:scale-[0.99] text-foreground';
		if (index === correctIdx) return 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 font-semibold ring-1 ring-green-500';
		if (index === selectedIndex) return 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-red-500';
		return 'border-border/40 bg-background/50 opacity-40';
	}
</script>

<div class="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
	<div class="flex items-center justify-between text-xs text-muted-foreground">
		{#if deck}
			<span class="font-medium text-primary">{deck.emoji ?? '⚡'} {deck.title ?? 'Quiz Set'}</span>
		{:else}
			<span class="font-mono text-primary font-medium">UPSC MCQ</span>
		{/if}
		<span class="rounded bg-muted px-2 py-0.5 font-mono text-[10px]">Select 1 of 4 options</span>
	</div>

	<!-- Question Text -->
	<h3 class="text-lg font-semibold leading-relaxed tracking-tight text-foreground">
		{questionText}
	</h3>

	<!-- Options List (A, B, C, D) -->
	<div class="grid grid-cols-1 gap-2.5">
		{#each optionsList as option, i (i)}
			<button
				type="button"
				onclick={() => handleSelect(i)}
				disabled={answered}
				class="flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all {optionStyle(i)}"
			>
				<div class="flex items-center gap-3">
					<span class="font-mono text-xs font-bold opacity-60">{letters[i]}</span>
					<span>{option}</span>
				</div>
				{#if answered}
					{#if i === correctIdx}
						<CheckCircle2 class="size-4 shrink-0 text-green-600" />
					{:else if i === selectedIndex}
						<XCircle class="size-4 shrink-0 text-red-600" />
					{/if}
				{/if}
			</button>
		{/each}
	</div>

	<!-- Answer Explanation / Hint -->
	{#if answered}
		<div class="rounded-xl border border-border/60 bg-muted/40 p-4 space-y-1.5 text-xs text-muted-foreground">
			<div class="flex items-center gap-1.5 font-semibold text-foreground">
				<HelpCircle class="size-3.5 text-primary" />
				<span>{selectedIndex === correctIdx ? 'Correct Answer!' : 'Explanation'}</span>
			</div>
			<p class="leading-relaxed">
				{card.explanation || card.back || 'Option ' + letters[correctIdx] + ' is the correct answer.'}
			</p>
		</div>
	{/if}
</div>
