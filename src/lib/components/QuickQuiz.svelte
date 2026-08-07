<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Stat from '$lib/components/Stat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { CheckCircle2, XCircle, HelpCircle, Sparkles, RefreshCw } from 'lucide-svelte';
	import { seededShuffle } from '$lib/engine/shuffle.js';
	import { missToast, nemesisVerdict } from '$lib/engine/nemesisToast.js';

	interface QuizQuestion {
		id: string;
		question: string;
		options: string[];
		correctIndex: number;
		explanation?: string;
		sourceQuiz?: string;
	}

	let {
		questions = [],
		quizId = 'quick-quiz',
		emoji = '📝',
		title = 'Quick Quiz',
		perRound = 10,
		nemesisStats = null,
		nemesisName = null,
		nemesisUserId = null,
		userName = 'Aspirant'
	}: {
		questions: QuizQuestion[];
		quizId?: string;
		emoji?: string;
		title?: string;
		perRound?: number;
		nemesisStats?: any;
		nemesisName?: string | null;
		nemesisUserId?: string | null;
		userName?: string;
	} = $props();

	const letters = ['A', 'B', 'C', 'D'];
	const startedAt = Date.now();

	let roundSeed = $state(`${quizId}:0`);
	let round = $state<QuizQuestion[]>(pickRound(roundSeed));
	let idx = $state(0);
	let results = $state<{ questionId: string; chosen: number | null; correct: boolean; ms: number }[]>([]);
	let misses = $state(new Map<string, number>());
	let done = $state(false);
	let posting = $state(false);
	let reveal = $state(false);
	let wrongPick = $state<number | null>(null);
	let advancing = $state(false);

	const current = $derived(round[idx]);
	const correctCount = $derived(results.filter((r) => r.correct).length);
	const progressPct = $derived(round.length > 0 ? (results.length / round.length) * 100 : 0);

	function pickRound(seed: string): QuizQuestion[] {
		if (!questions || questions.length === 0) return [];
		return seededShuffle(questions, seed).slice(0, Math.min(perRound, questions.length));
	}

	function nemesisRateFor(id: string) {
		const s = nemesisStats?.[id];
		return s && s.totalCount > 0 ? s.correctCount / s.totalCount : null;
	}

	function notifyMiss(q: QuizQuestion) {
		const count = (misses.get(q.id) ?? 0) + 1;
		misses.set(q.id, count);
		const data = missToast({
			missCount: count,
			nemesisRate: nemesisRateFor(q.id),
			nemesisName: nemesisName ?? 'your rival',
			correctText: q.options[q.correctIndex]
		});
		if (data.tone === 'error') toast.error(data.title, { description: data.body });
		else toast.warning(data.title, { description: data.body });
	}

	function answerByOption(i: number) {
		if (advancing || done || !current) return;
		const q = current;
		const correct = i === q.correctIndex;
		results.push({ questionId: q.id, chosen: i, correct, ms: Date.now() - startedAt });
		if (!correct) wrongPick = i;
		reveal = true;
		if (correct) toast.success('Correct!', { description: 'Nice recall. On to the next.' });
		else notifyMiss(q);
		advance(correct ? 450 : 1600);
	}

	function revealAnswer() {
		if (advancing || done || !current) return;
		const q = current;
		results.push({ questionId: q.id, chosen: null, correct: false, ms: Date.now() - startedAt });
		wrongPick = null;
		reveal = true;
		notifyMiss(q);
		advance(1600);
	}

	function advance(delay: number) {
		advancing = true;
		setTimeout(() => {
			advancing = false;
			reveal = false;
			wrongPick = null;
			if (idx + 1 < round.length) idx++;
			else finish();
		}, delay);
	}

	async function finish() {
		done = true;
		posting = true;
		const correct = results.filter((r) => r.correct).length;
		const total = results.length;

		let nemesisPayload = undefined;
		if (nemesisUserId) {
			let nc = 0,
				nt = 0;
			if (nemesisStats)
				for (const s of Object.values(nemesisStats) as any[]) {
					nc += s.correctCount;
					nt += s.totalCount;
				}
			if (nt > 0 && total > 0) {
				const myRate = correct / total,
					theirRate = nc / nt;
				nemesisPayload = {
					nemesisUserId,
					myCorrect: correct,
					myTotal: total,
					theirCorrect: nc,
					theirTotal: nt,
					outcome: myRate > theirRate ? 'win' : myRate < theirRate ? 'loss' : 'draw'
				};
			}
		}
		try {
			await fetch('/api/quiz', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					quizId,
					startedAt,
					endedAt: Date.now(),
					results: results.map((r) => ({ questionId: r.questionId, correct: r.correct, ms: r.ms })),
					nemesis: nemesisPayload
				})
			});
		} catch {}
		if (nemesisPayload && nemesisName) {
			const v = nemesisVerdict({
				nemesisName,
				myScore: correct,
				myTotal: total,
				theirScore: +nemesisPayload.theirCorrect,
				theirTotal: +nemesisPayload.theirTotal,
				record: null
			});
			toast(v.title, { description: v.body, duration: 8000 });
		}
		posting = false;
	}

	function restart() {
		roundSeed = `${quizId}:${Date.now()}`;
		round = pickRound(roundSeed);
		idx = 0;
		results = [];
		misses = new Map();
		done = false;
		reveal = false;
		wrongPick = null;
		advancing = false;
	}

	function optionClass(i: number) {
		if (!reveal) return 'border-input bg-background/80 hover:bg-accent/40 hover:border-primary/50 active:scale-[0.99] text-foreground shadow-2xs';
		if (i === current.correctIndex) return 'border-success bg-success/15 text-success font-semibold shadow-xs';
		if (i === wrongPick) return 'border-destructive bg-destructive/15 text-destructive font-semibold shadow-xs';
		return 'border-border/40 bg-muted/30 text-muted-foreground opacity-50';
	}
</script>

<div class="space-y-4 sm:space-y-5">
	{#if round.length === 0}
		<div class="py-12 text-center space-y-3">
			<p class="text-3xl">📝</p>
			<p class="font-display text-lg font-semibold tracking-tight text-foreground">No questions in this round</p>
			<p class="text-xs text-muted-foreground max-w-sm mx-auto">Select a different topic from the syllabus tree or reset filters to load questions.</p>
		</div>
	{:else if done}
		<div class="space-y-4 pt-4 text-center animate-in fade-in zoom-in-95 duration-200">
			<h1 class="font-display text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
				{Math.round((correctCount / round.length) * 100)}%
			</h1>
			<p class="text-sm text-muted-foreground">{correctCount} of {round.length} questions correct</p>
			<div class="grid grid-cols-2 gap-3 max-w-md mx-auto">
				<Stat label="Correct" value={correctCount} />
				<Stat label="Missed" value={round.length - correctCount} />
			</div>
			<div class="flex flex-wrap justify-center gap-3 pt-3">
				<Button onclick={restart} class="gap-1.5 font-semibold">
					<RefreshCw class="size-4" /> Practice New Round
				</Button>
				<Button variant="outline" onclick={() => goto('/quiz')}>All Quizzes</Button>
			</div>
		</div>
	{:else if current}
		<!-- Header progress bar -->
		<div class="flex items-center justify-between text-xs">
			<div>
				<p class="font-mono text-xs font-semibold text-primary flex items-center gap-1.5">
					<span>{emoji}</span>
					<span>{title}</span>
				</p>
				<p class="text-[11px] text-muted-foreground">{round.length} questions in round · select best option</p>
			</div>
			<div class="text-right">
				<p class="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
					{correctCount}<span class="text-sm font-normal text-muted-foreground">/{results.length}</span>
				</p>
				<p class="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Score</p>
			</div>
		</div>

		<!-- Smooth progress line -->
		<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
			<div class="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={`width: ${progressPct}%`}></div>
		</div>

		<!-- Question Box -->
		<Card class="p-4 sm:p-6 border border-border bg-card space-y-3 sm:space-y-4 shadow-sm animate-in fade-in duration-200">
			<div class="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-2.5">
				<span class="font-mono omr-bubble font-bold text-foreground">Q {idx + 1} / {round.length}</span>
				<Badge variant="secondary" class="font-mono text-[10px]">
					{emoji}{#if current.sourceQuiz} · {current.sourceQuiz}{/if}
				</Badge>
			</div>

			<h2 class="text-base sm:text-lg font-semibold leading-relaxed text-foreground">
				{current.question}
			</h2>

			{#if reveal && wrongPick === null}
				<p class="text-xs sm:text-sm font-semibold text-success flex items-center gap-1 animate-in fade-in duration-150">
					✓ {current.options[current.correctIndex]}
				</p>
			{/if}
		</Card>

		<!-- Options Grid -->
		<div class="grid grid-cols-1 gap-2.5">
			{#each current.options as option, i (i)}
				<button
					type="button"
					onclick={() => answerByOption(i)}
					disabled={advancing || reveal}
					class={`flex items-center gap-3 rounded-xl border-2 px-3.5 py-3 sm:px-4 sm:py-3.5 text-left text-xs sm:text-sm font-medium transition-all duration-200 ${optionClass(i)} ${reveal && i === current.correctIndex ? 'animate-pulse' : ''}`}
				>
					<span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted/80 font-mono text-xs font-bold text-foreground opacity-80">
						{letters[i]}
					</span>
					<span class="leading-normal">{option}</span>
				</button>
			{/each}

			{#if !reveal}
				<button
					type="button"
					onclick={revealAnswer}
					disabled={advancing}
					class="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-xs sm:text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-1"
				>
					<HelpCircle class="size-4 text-primary" />
					<span>I don't know — reveal answer</span>
				</button>
			{/if}
		</div>
	{/if}
</div>
