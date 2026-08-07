<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Clock, AlertTriangle, CheckCircle2, XCircle, Award, ArrowLeft, ArrowRight, Grid } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { calculatePrelimsScore, type QuestionResult, type PrelimsScorecard } from '$lib/engine/quizEngine.ts';

	interface Question {
		id: string;
		question: string;
		options: string[];
		correctIndex: number;
		explanation?: string;
		subject?: string;
	}

	let {
		questions = [],
		onClose,
		onFinish
	}: {
		questions: Question[];
		onClose: () => void;
		onFinish?: (scorecard: PrelimsScorecard) => void;
	} = $props();

	const totalQuestions = $derived(questions.length);

	let currentIndex = $state(0);
	let userAnswers = $state<Record<number, number>>({});
	let markedForReview = $state<Record<number, boolean>>({});
	let questionTimes = $state<Record<number, number>>({});
	let currentQuestionStartTime = $state(Date.now());
	let startedAt = $state(Date.now());
	let endedAt = $state<number | null>(null);
	let submitted = $state(false);
	let scorecard = $state<PrelimsScorecard | null>(null);
	let showMobilePalette = $state(false);

	let timeRemaining = $state(totalQuestions * 120);

	const timerInterval = setInterval(() => {
		if (submitted || timeRemaining <= 0) return;
		timeRemaining--;
		if (timeRemaining <= 0) {
			submitExam();
		}
	}, 1000);

	onDestroy(() => {
		clearInterval(timerInterval);
	});

	function formatTimer(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function trackTimeSpentOnCurrent() {
		const now = Date.now();
		const elapsed = now - currentQuestionStartTime;
		questionTimes[currentIndex] = (questionTimes[currentIndex] ?? 0) + elapsed;
		currentQuestionStartTime = now;
	}

	function selectQuestion(idx: number) {
		trackTimeSpentOnCurrent();
		currentIndex = idx;
		showMobilePalette = false;
	}

	function chooseOption(optIndex: number) {
		if (submitted) return;
		if (userAnswers[currentIndex] === optIndex) {
			delete userAnswers[currentIndex];
		} else {
			userAnswers[currentIndex] = optIndex;
		}
	}

	function toggleReview() {
		markedForReview[currentIndex] = !markedForReview[currentIndex];
	}

	function submitExam() {
		if (submitted) return;
		trackTimeSpentOnCurrent();
		endedAt = Date.now();
		submitted = true;

		const results: QuestionResult[] = questions.map((q, i) => {
			const chosen = userAnswers[i] ?? null;
			const correct = chosen === q.correctIndex;
			return {
				questionId: q.id,
				chosen,
				correct,
				ms: questionTimes[i] ?? 1000
			};
		});

		scorecard = calculatePrelimsScore(results, totalQuestions, startedAt, endedAt);
		if (onFinish && scorecard) {
			onFinish(scorecard);
		}
	}

	const currentQ = $derived(questions[currentIndex]);
	const letters = ['A', 'B', 'C', 'D'];
</script>

<div class="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-y-auto">
	<!-- Mobile-Optimized Top Bar -->
	<header class="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur px-3 py-2.5 sm:px-6 sm:py-3.5 flex items-center justify-between shadow-xs">
		<div class="flex items-center gap-2 sm:gap-3 min-w-0">
			<button onclick={onClose} class="rounded-lg p-1 sm:p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0">
				<ArrowLeft class="size-4 sm:size-5" />
			</button>
			<div class="min-w-0">
				<div class="flex items-center gap-1.5 sm:gap-2 truncate">
					<Badge variant="default" class="font-mono text-[10px] sm:text-xs font-bold truncate">UPSC PRELIMS</Badge>
					<span class="text-[10px] sm:text-xs font-medium text-muted-foreground hidden sm:inline-block">+2.0 / -0.66</span>
				</div>
			</div>
		</div>

		{#if !submitted}
			<div class="flex items-center gap-2 sm:gap-4 shrink-0">
				<!-- Question palette trigger on mobile -->
				<Button variant="ghost" size="sm" onclick={() => (showMobilePalette = !showMobilePalette)} class="lg:hidden p-1.5 h-8 gap-1 text-xs">
					<Grid class="size-4" />
					<span class="text-[11px] font-mono">{currentIndex + 1}/{totalQuestions}</span>
				</Button>

				<div class="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm font-semibold {timeRemaining < 300 ? 'text-destructive animate-pulse' : 'text-primary'}">
					<Clock class="size-3.5 sm:size-4" />
					<span>{formatTimer(timeRemaining)}</span>
				</div>

				<Button variant="default" size="sm" onclick={submitExam} class="gap-1 text-xs sm:text-sm px-2.5 py-1 sm:px-3 sm:py-1.5 font-semibold bg-success hover:bg-success/90 text-success-foreground">
					<span>Submit</span><span class="hidden sm:inline"> OMR</span>
				</Button>
			</div>
		{:else}
			<Button variant="outline" size="sm" onclick={onClose} class="text-xs">Exit</Button>
		{/if}
	</header>

	<!-- Mobile Palette Bar (Collapsible Strip on Mobile) -->
	{#if !submitted && showMobilePalette}
		<div class="lg:hidden sticky top-12 z-10 border-b border-border bg-card p-3 space-y-2 shadow-md animate-in slide-in-from-top duration-200">
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span class="font-mono font-bold uppercase">Select Question</span>
				<button onclick={() => (showMobilePalette = false)} class="text-xs font-semibold text-primary">Close</button>
			</div>
			<div class="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-none">
				{#each questions as _, idx (idx)}
					{@const isAnswered = userAnswers[idx] !== undefined}
					{@const isMarked = markedForReview[idx]}
					{@const isCurrent = currentIndex === idx}

					<button
						type="button"
						onclick={() => selectQuestion(idx)}
						class="flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all border {isCurrent ? 'ring-2 ring-primary border-primary' : ''} {isMarked ? 'bg-warning/20 text-warning border-warning' : isAnswered ? 'bg-success/20 text-success border-success' : 'bg-muted text-muted-foreground border-border'}"
					>
						{idx + 1}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<main class="mx-auto max-w-5xl w-full flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
		{#if submitted && scorecard}
			<!-- Scorecard Results View -->
			<div class="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
				<!-- Banner Cutoff Header -->
				<Card class="p-4 sm:p-6 border border-border bg-card text-foreground shadow-md space-y-4">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-border/60 pb-4">
						<div>
							<span class="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Prelims Exam Performance</span>
							<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono mt-1 text-foreground">
								{scorecard.scaledScore200} <span class="text-lg sm:text-xl font-normal text-muted-foreground">/ 200 Marks</span>
							</h1>
						</div>

						<Badge variant={scorecard.cutoffVerdict.tone === 'green' ? 'success' : scorecard.cutoffVerdict.tone === 'amber' ? 'warning' : 'destructive'} class="w-full sm:w-auto justify-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold gap-1.5">
							<Award class="size-4 sm:size-5" />
							<span>{scorecard.cutoffVerdict.label}</span>
						</Badge>
					</div>

					<p class="text-xs sm:text-sm leading-relaxed text-muted-foreground">
						{scorecard.cutoffVerdict.detail}
					</p>

					<!-- Stats Matrix Mobile Responsive Grid -->
					<div class="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 pt-2">
						<div class="rounded-lg bg-muted/50 p-2.5 sm:p-3 text-center border border-border/40">
							<p class="text-[10px] sm:text-xs text-muted-foreground font-medium">Attempted</p>
							<p class="text-base sm:text-xl font-bold font-mono mt-0.5 text-foreground">{scorecard.attempted}/{scorecard.totalQuestions}</p>
						</div>
						<div class="rounded-lg bg-success/15 p-2.5 sm:p-3 text-center border border-success/30">
							<p class="text-[10px] sm:text-xs text-success font-medium">Correct (+2.0)</p>
							<p class="text-base sm:text-xl font-bold font-mono text-success mt-0.5">{scorecard.correct}</p>
						</div>
						<div class="rounded-lg bg-destructive/15 p-2.5 sm:p-3 text-center border border-destructive/30">
							<p class="text-[10px] sm:text-xs text-destructive font-medium">Wrong (-0.66)</p>
							<p class="text-base sm:text-xl font-bold font-mono text-destructive mt-0.5">{scorecard.incorrect}</p>
						</div>
						<div class="rounded-lg bg-muted/50 p-2.5 sm:p-3 text-center border border-border/40">
							<p class="text-[10px] sm:text-xs text-muted-foreground font-medium">Accuracy</p>
							<p class="text-base sm:text-xl font-bold font-mono mt-0.5 text-foreground">{scorecard.accuracyPct}%</p>
						</div>
						<div class="rounded-lg bg-warning/15 p-2.5 sm:p-3 text-center border border-warning/30 col-span-2 sm:col-span-1">
							<p class="text-[10px] sm:text-xs text-warning font-medium">Hesitant (>45s)</p>
							<p class="text-base sm:text-xl font-bold font-mono text-warning mt-0.5">{scorecard.hesitantCount}</p>
						</div>
					</div>
				</Card>

				<!-- Detailed Question Review Section -->
				<div class="space-y-4">
					<h3 class="font-display text-base sm:text-lg font-semibold tracking-tight text-foreground">Question-by-Question Review</h3>
					<div class="space-y-3 sm:space-y-4">
						{#each questions as q, idx (q.id)}
							{@const chosen = userAnswers[idx]}
							{@const isCorrect = chosen === q.correctIndex}
							{@const isUnattempted = chosen === undefined}

							<Card class="p-4 sm:p-5 border border-border space-y-3">
								<div class="flex items-center justify-between text-xs text-muted-foreground">
									<span class="font-mono font-bold">Q{idx + 1} of {totalQuestions}</span>
									{#if isUnattempted}
										<Badge variant="secondary" class="text-[10px]">Unattempted (0.0)</Badge>
									{:else if isCorrect}
										<Badge variant="success" class="text-[10px]">✓ Correct (+2.0)</Badge>
									{:else}
										<Badge variant="destructive" class="text-[10px]">✗ Incorrect (-0.66)</Badge>
									{/if}
								</div>

								<p class="text-sm sm:text-base font-semibold leading-relaxed text-foreground">{q.question}</p>

								<div class="grid grid-cols-1 gap-2 pt-1">
									{#each q.options as opt, optIdx (optIdx)}
										<div class="flex items-center justify-between rounded-lg border px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-medium {optIdx === q.correctIndex ? 'border-success bg-success/15 text-success font-semibold' : optIdx === chosen ? 'border-destructive bg-destructive/15 text-destructive' : 'border-border opacity-60'}">
											<span class="pr-2">{letters[optIdx]}. {opt}</span>
											{#if optIdx === q.correctIndex}
												<CheckCircle2 class="size-4 text-success shrink-0" />
											{:else if optIdx === chosen}
												<XCircle class="size-4 text-destructive shrink-0" />
											{/if}
										</div>
									{/each}
								</div>

								{#if q.explanation}
									<div class="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground border border-border/40 mt-2">
										<span class="font-bold text-foreground">Explanation:</span> {q.explanation}
									</div>
								{/if}
							</Card>
						{/each}
					</div>
				</div>
			</div>
		{:else if currentQ}
			<!-- Exam Taking View -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
				<!-- Question Area -->
				<div class="lg:col-span-8 space-y-4 sm:space-y-6">
					<Card class="p-4 sm:p-6 border border-border bg-card space-y-4 sm:space-y-6 shadow-sm">
						<div class="flex items-center justify-between text-xs text-muted-foreground">
							<span class="font-mono font-bold text-primary">Question {currentIndex + 1} of {totalQuestions}</span>
							<button onclick={toggleReview} class="flex items-center gap-1 text-xs font-medium {markedForReview[currentIndex] ? 'text-warning font-bold' : 'text-muted-foreground hover:text-foreground'}">
								<AlertTriangle class="size-3.5" />
								<span>{markedForReview[currentIndex] ? 'Marked' : 'Mark Review'}</span>
							</button>
						</div>

						<h2 class="text-base sm:text-xl font-semibold leading-relaxed text-foreground">
							{currentQ.question}
						</h2>

						<div class="grid grid-cols-1 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
							{#each currentQ.options as opt, optIdx (optIdx)}
								{@const isSelected = userAnswers[currentIndex] === optIdx}
								<button
									type="button"
									onclick={() => chooseOption(optIdx)}
									class="flex items-center justify-between rounded-xl border-2 px-3.5 py-3 sm:px-4 sm:py-3.5 text-left text-xs sm:text-sm font-medium transition-all {isSelected ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary' : 'border-input bg-background hover:bg-muted text-foreground'}"
								>
									<div class="flex items-center gap-2.5 sm:gap-3 pr-2">
										<span class="font-mono text-xs font-bold opacity-60 shrink-0">{letters[optIdx]}</span>
										<span class="leading-normal">{opt}</span>
									</div>
									<div class="size-4 shrink-0 rounded-full border border-primary/40 flex items-center justify-center {isSelected ? 'bg-primary border-primary' : ''}">
										{#if isSelected}
											<div class="size-1.5 rounded-full bg-primary-foreground"></div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					</Card>

					<!-- Bottom Mobile Prev / Next Nav -->
					<div class="flex items-center justify-between gap-3">
						<Button
							variant="outline"
							disabled={currentIndex === 0}
							onclick={() => selectQuestion(currentIndex - 1)}
							class="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm h-10"
						>
							<ArrowLeft class="size-4" /> Previous
						</Button>

						<Button
							variant="default"
							disabled={currentIndex === totalQuestions - 1}
							onclick={() => selectQuestion(currentIndex + 1)}
							class="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm h-10"
						>
							Next <ArrowRight class="size-4" />
						</Button>
					</div>
				</div>

				<!-- Question Palette Sidebar (Desktop Sidebar / Mobile Accessible) -->
				<div class="hidden lg:block lg:col-span-4 space-y-4">
					<Card class="p-4 border border-border bg-card space-y-4 sticky top-20">
						<h3 class="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Palette</h3>

						<div class="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
							{#each questions as _, idx (idx)}
								{@const isAnswered = userAnswers[idx] !== undefined}
								{@const isMarked = markedForReview[idx]}
								{@const isCurrent = currentIndex === idx}

								<button
									type="button"
									onclick={() => selectQuestion(idx)}
									class="flex size-9 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all border {isCurrent ? 'ring-2 ring-primary ring-offset-1 border-primary' : ''} {isMarked ? 'bg-warning/20 text-warning border-warning' : isAnswered ? 'bg-success/20 text-success border-success' : 'bg-muted text-muted-foreground border-border'}"
								>
									{idx + 1}
								</button>
							{/each}
						</div>

						<div class="space-y-1.5 text-[11px] text-muted-foreground pt-2 border-t border-border/60">
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded bg-success"></span>
								<span>Answered</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded bg-warning"></span>
								<span>Marked for Review</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded bg-muted border"></span>
								<span>Unattempted</span>
							</div>
						</div>
					</Card>
				</div>
			</div>
		{/if}
	</main>
</div>
