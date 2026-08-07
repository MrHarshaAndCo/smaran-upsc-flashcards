<script lang="ts">
	import { untrack } from 'svelte';
	import { CheckCircle2, XCircle, HelpCircle, Sparkles } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';

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

	let currentCardId = $state<string | null>(null);
	$effect(() => {
		const newId = card.id;
		if (newId !== untrack(() => currentCardId)) {
			currentCardId = newId;
			selectedIndex = null;
			answered = false;
		}
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
		if (!answered) return 'border-input bg-background/80 hover:bg-accent/40 hover:border-primary/50 active:scale-[0.99] text-foreground shadow-2xs';
		if (index === correctIdx) return 'border-success bg-success/15 text-success font-semibold ring-1 ring-success/50 shadow-xs';
		if (index === selectedIndex) return 'border-destructive bg-destructive/15 text-destructive font-semibold ring-1 ring-destructive/50 shadow-xs';
		return 'border-border/40 bg-muted/30 text-muted-foreground opacity-50';
	}
</script>

<div class="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200">
	<!-- Card Header -->
	<div class="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3">
		{#if deck}
			<span class="font-semibold text-primary flex items-center gap-1.5">
				<span>{deck.emoji ?? '⚡'}</span>
				<span>{deck.title ?? 'Quiz Set'}</span>
			</span>
		{:else}
			<span class="font-mono text-primary font-semibold flex items-center gap-1">
				<Sparkles class="size-3.5" /> UPSC MCQ Flashcard
			</span>
		{/if}
		<Badge variant="outline" class="font-mono text-[10px] uppercase font-medium">Select 1 of 4</Badge>
	</div>

	<!-- Question Text -->
	<h3 class="text-base sm:text-lg font-semibold leading-relaxed text-foreground tracking-tight">
		{questionText}
	</h3>

	<!-- Options List (A, B, C, D) -->
	<div class="grid grid-cols-1 gap-2.5">
		{#each optionsList as option, i (i)}
			<button
				type="button"
				onclick={() => handleSelect(i)}
				disabled={answered}
				class="flex items-center justify-between rounded-xl border-2 px-3.5 py-3 sm:px-4 sm:py-3.5 text-left text-xs sm:text-sm font-medium transition-all duration-200 {optionStyle(i)}"
			>
				<div class="flex items-center gap-3 pr-2 min-w-0">
					<span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted/80 font-mono text-xs font-bold text-foreground opacity-80">
						{letters[i]}
					</span>
					<span class="leading-normal truncate sm:whitespace-normal">{option}</span>
				</div>

				{#if answered}
					{#if i === correctIdx}
						<CheckCircle2 class="size-5 shrink-0 text-success animate-in zoom-in-75 duration-150" />
					{:else if i === selectedIndex}
						<XCircle class="size-5 shrink-0 text-destructive animate-in zoom-in-75 duration-150" />
					{/if}
				{/if}
			</button>
		{/each}
	</div>

	<!-- Answer Explanation / Hint -->
	{#if answered}
		<div class="rounded-xl border border-border/60 bg-muted/40 p-4 space-y-1.5 text-xs text-muted-foreground animate-in slide-in-from-top-2 duration-200">
			<div class="flex items-center gap-1.5 font-semibold text-foreground">
				<HelpCircle class="size-4 text-primary" />
				<span>{selectedIndex === correctIdx ? 'Correct Answer!' : 'Explanation'}</span>
			</div>
			<p class="leading-relaxed">
				{card.explanation || card.back || 'Option ' + letters[correctIdx] + ' is the correct answer.'}
			</p>
		</div>
	{/if}
</div>
