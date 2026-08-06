<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Clock, AlertTriangle, CheckCircle2, XCircle, Award, RotateCcw, ArrowLeft, ArrowRight, ShieldAlert, Zap } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
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
	let userAnswers = $state<Record<number, number>>({}); // index -> chosen option
	let markedForReview = $state<Record<number, boolean>>({});
	let questionTimes = $state<Record<number, number>>({}); // index -> ms spent
	let currentQuestionStartTime = $state(Date.now());
	let startedAt = $state(Date.now());
	let endedAt = $state<number | null>(null);
	let submitted = $state(false);
	let scorecard = $state<PrelimsScorecard | null>(null);

	// Timer (2 minutes per question default: e.g. 20 questions = 40 mins)
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
	}

	function chooseOption(optIndex: number) {
		if (submitted) return;
		if (userAnswers[currentIndex] === optIndex) {
			// Deselect option
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
	<!-- Top Bar -->
	<header class="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur px-6 py-3.5 flex items-center justify-between shadow-xs">
		<div class="flex items-center gap-3">
			<button onclick={onClose} class="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground">
				<ArrowLeft class="size-5" />
			</button>
			<div>
				<div class="flex items-center gap-2">
					<span class="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">UPSC PRELIMS SIMULATOR</span>
					<span class="text-xs font-medium text-muted-foreground">+2.0 Marks / -0.66 Negative</span>
				</div>
			</div>
		</div>

		{#if !submitted}
			<div class="flex items-center gap-6">
				<div class="flex items-center gap-2 font-mono text-sm font-semibold {timeRemaining < 300 ? 'text-red-500 animate-pulse' : 'text-primary'}">
					<Clock class="size-4" />
					<span>{formatTimer(timeRemaining)}</span>
				</div>

				<Button variant="default" size="sm" onclick={submitExam} class="gap-1.5 font-semibold bg-green-600 hover:bg-green-700 text-white">
					<span>Submit OMR Exam</span>
				</Button>
			</div>
		{:else}
			<Button variant="outline" size="sm" onclick={onClose}>Exit Simulator</Button>
		{/if}
	</header>

	<main class="mx-auto max-w-5xl w-full flex-1 p-6 space-y-6">
		{#if submitted && scorecard}
			<!-- Scorecard Results View -->
			<div class="space-y-6 animate-in fade-in duration-300">
				<!-- Banner Cutoff Header -->
				<Card class="p-6 border border-border bg-card text-foreground shadow-md space-y-4">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
						<div>
							<span class="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Prelims Exam Performance</span>
							<h1 class="text-4xl font-extrabold tracking-tight font-mono mt-1">
								{scorecard.scaledScore200} <span class="text-xl font-normal text-muted-foreground">/ 200 Marks</span>
							</h1>
						</div>

						<div class="flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm border {scorecard.cutoffVerdict.tone === 'green' ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400' : scorecard.cutoffVerdict.tone === 'amber' ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400'}">
							<Award class="size-5" />
							<span>{scorecard.cutoffVerdict.label}</span>
						</div>
					</div>

					<p class="text-sm leading-relaxed text-muted-foreground">
						{scorecard.cutoffVerdict.detail}
					</p>

					<!-- Stats Matrix -->
					<div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
						<div class="rounded-lg bg-muted/50 p-3 text-center border border-border/40">
							<p class="text-xs text-muted-foreground font-medium">Attempted</p>
							<p class="text-xl font-bold font-mono mt-0.5">{scorecard.attempted}/{scorecard.totalQuestions}</p>
						</div>
						<div class="rounded-lg bg-green-500/10 p-3 text-center border border-green-500/30">
							<p class="text-xs text-green-700 dark:text-green-400 font-medium">Correct (+2.0)</p>
							<p class="text-xl font-bold font-mono text-green-600 mt-0.5">{scorecard.correct}</p>
						</div>
						<div class="rounded-lg bg-red-500/10 p-3 text-center border border-red-500/30">
							<p class="text-xs text-red-700 dark:text-red-400 font-medium">Wrong (-0.66)</p>
							<p class="text-xl font-bold font-mono text-red-600 mt-0.5">{scorecard.incorrect}</p>
						</div>
						<div class="rounded-lg bg-muted/50 p-3 text-center border border-border/40">
							<p class="text-xs text-muted-foreground font-medium">Accuracy</p>
							<p class="text-xl font-bold font-mono mt-0.5">{scorecard.accuracyPct}%</p>
						</div>
						<div class="rounded-lg bg-amber-500/10 p-3 text-center border border-amber-500/30">
							<p class="text-xs text-amber-700 dark:text-amber-400 font-medium">Hesitant (>45s)</p>
							<p class="text-xl font-bold font-mono text-amber-600 mt-0.5">{scorecard.hesitantCount}</p>
						</div>
					</div>
				</Card>

				<!-- Detailed Question Review Section -->
				<div class="space-y-4">
					<h3 class="font-display text-lg font-semibold tracking-tight">Question-by-Question Review</h3>
					<div class="space-y-4">
						{#each questions as q, idx (q.id)}
							{@const chosen = userAnswers[idx]}
							{@const isCorrect = chosen === q.correctIndex}
							{@const isUnattempted = chosen === undefined}

							<Card class="p-5 border border-border space-y-3">
								<div class="flex items-center justify-between text-xs text-muted-foreground">
									<span class="font-mono font-bold">Q{idx + 1} of {totalQuestions}</span>
									{#if isUnattempted}
										<span class="rounded bg-muted px-2 py-0.5 font-medium">Unattempted (0.0)</span>
									{:else if isCorrect}
										<span class="rounded bg-green-500/10 text-green-600 font-bold px-2 py-0.5">✓ Correct (+2.0)</span>
									{:else}
										<span class="rounded bg-red-500/10 text-red-600 font-bold px-2 py-0.5">✗ Incorrect (-0.66)</span>
									{/if}
								</div>

								<p class="text-base font-semibold leading-relaxed">{q.question}</p>

								<div class="grid grid-cols-1 gap-2 pt-1">
									{#each q.options as opt, optIdx (optIdx)}
										<div class="flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-xs font-medium {optIdx === q.correctIndex ? 'border-green-500 bg-green-500/10 text-green-700 font-semibold' : optIdx === chosen ? 'border-red-500 bg-red-500/10 text-red-700' : 'border-border opacity-60'}">
											<span>{letters[optIdx]}. {opt}</span>
											{#if optIdx === q.correctIndex}
												<CheckCircle2 class="size-4 text-green-600" />
											{:else if optIdx === chosen}
												<XCircle class="size-4 text-red-600" />
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
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				<!-- Question Area -->
				<div class="lg:col-span-8 space-y-6">
					<Card class="p-6 border border-border bg-card space-y-6 shadow-sm">
						<div class="flex items-center justify-between text-xs text-muted-foreground">
							<span class="font-mono font-bold text-primary">Question {currentIndex + 1} of {totalQuestions}</span>
							<button onclick={toggleReview} class="flex items-center gap-1 text-xs font-medium {markedForReview[currentIndex] ? 'text-amber-500 font-bold' : 'text-muted-foreground hover:text-foreground'}">
								<AlertTriangle class="size-3.5" />
								<span>{markedForReview[currentIndex] ? 'Marked for Review' : 'Mark for Review'}</span>
							</button>
						</div>

						<h2 class="text-xl font-semibold leading-relaxed text-foreground">
							{currentQ.question}
						</h2>

						<div class="grid grid-cols-1 gap-3 pt-2">
							{#each currentQ.options as opt, optIdx (optIdx)}
								{@const isSelected = userAnswers[currentIndex] === optIdx}
								<button
									type="button"
									onclick={() => chooseOption(optIdx)}
									class="flex items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all {isSelected ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary' : 'border-input bg-background hover:bg-muted text-foreground'}"
								>
									<div class="flex items-center gap-3">
										<span class="font-mono text-xs font-bold opacity-60">{letters[optIdx]}</span>
										<span>{opt}</span>
									</div>
									<div class="size-4 rounded-full border border-primary/40 flex items-center justify-center {isSelected ? 'bg-primary border-primary' : ''}">
										{#if isSelected}
											<div class="size-1.5 rounded-full bg-primary-foreground"></div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					</Card>

					<!-- Bottom Prev / Next Nav -->
					<div class="flex items-center justify-between">
						<Button
							variant="outline"
							disabled={currentIndex === 0}
							onclick={() => selectQuestion(currentIndex - 1)}
							class="gap-1.5"
						>
							<ArrowLeft class="size-4" /> Previous
						</Button>

						<Button
							variant="default"
							disabled={currentIndex === totalQuestions - 1}
							onclick={() => selectQuestion(currentIndex + 1)}
							class="gap-1.5"
						>
							Next <ArrowRight class="size-4" />
						</Button>
					</div>
				</div>

				<!-- Question Palette Sidebar -->
				<div class="lg:col-span-4 space-y-4">
					<Card class="p-4 border border-border bg-card space-y-4">
						<h3 class="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Palette</h3>

						<div class="grid grid-cols-5 gap-2">
							{#each questions as _, idx (idx)}
								{@const isAnswered = userAnswers[idx] !== undefined}
								{@const isMarked = markedForReview[idx]}
								{@const isCurrent = currentIndex === idx}

								<button
									type="button"
									onclick={() => selectQuestion(idx)}
									class="flex size-9 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all border {isCurrent ? 'ring-2 ring-primary ring-offset-1 border-primary' : ''} {isMarked ? 'bg-amber-500/20 text-amber-600 border-amber-500' : isAnswered ? 'bg-green-500/20 text-green-600 border-green-500' : 'bg-muted text-muted-foreground border-border'}"
								>
									{idx + 1}
								</button>
							{/each}
						</div>

						<div class="space-y-1.5 text-[11px] text-muted-foreground pt-2 border-t border-border/60">
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded bg-green-500"></span>
								<span>Answered</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded bg-amber-500"></span>
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
