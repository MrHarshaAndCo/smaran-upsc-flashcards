<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Flame, LineChart, BookOpen, ArrowRight, Sparkles, Award, ShieldAlert, Play } from 'lucide-svelte';
	import QuickQuiz from '$lib/components/QuickQuiz.svelte';
	import SubjectTree from '$lib/components/SubjectTree.svelte';
	import PrelimsMockSimulator from '$lib/components/PrelimsMockSimulator.svelte';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();

	let subject = $state('all');
	let subTopic = $state('all');
	let pool = $state(data.pool);
	let busy = $state(false);
	let showMockSimulator = $state(false);

	const activeLabel = $derived.by(() => {
		if (subject === 'all') return 'Mixed Grand Test';
		if (subTopic === 'all') return subject;
		return `${subject} · ${subTopic}`;
	});

	async function handleTreeSelect(selection: { subject: string; subTopic: string }) {
		subject = selection.subject;
		subTopic = selection.subTopic;
		await reloadPool();
	}

	async function reloadPool() {
		busy = true;
		try {
			const qs = new URLSearchParams({ limit: '50' });
			if (subject !== 'all') qs.set('subject', subject);
			if (subTopic !== 'all') qs.set('subTopic', subTopic);
			const r = await fetch(`/api/questions?${qs}`);
			const j = await r.json();
			if (!j.questions?.length) {
				toast.error('No questions for that filter yet');
				busy = false;
				return;
			}
			pool = j.questions.map((q: any) => ({
				id: q.id,
				question: q.question,
				options: q.options,
				correctIndex: q.answerIndex,
				explanation: q.explanation ?? '',
				sourceQuiz: q.subject
			}));
		} catch {
			toast.error('Could not load questions');
		}
		busy = false;
	}

	function launchMockExam() {
		if (!pool || pool.length === 0) {
			toast.error('No questions loaded for mock exam');
			return;
		}
		showMockSimulator = true;
	}
</script>

{#if showMockSimulator}
	<PrelimsMockSimulator
		questions={pool}
		onClose={() => (showMockSimulator = false)}
		onFinish={(scorecard) => {
			toast.success(`Mock Exam Submitted! Score: ${scorecard.scaledScore200}/200 Marks`, {
				description: scorecard.cutoffVerdict.label
			});
		}}
	/>
{/if}

<div class="mx-auto max-w-5xl space-y-8 pt-6">
	<!-- Page Header -->
	<header class="border-b border-border pb-5">
		<div class="flex items-end justify-between gap-4">
			<div>
				<div class="flex items-center gap-2">
					<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
						<Sparkles class="size-3" />
						UPSC PRELIMS MCQ QUIZ
					</span>
				</div>
				<h1 class="font-display mt-2 text-3xl italic tracking-tight">{activeLabel}</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					{data.questionTotal.toLocaleString('en-IN')} Prelims questions · select any subject or sub-tree node below to start a quiz
				</p>
			</div>

			<div class="flex items-center gap-3">
				<!-- Launch Prelims Mock Simulator -->
				<Button onclick={launchMockExam} class="gap-1.5 font-semibold bg-primary text-primary-foreground shadow-xs">
					<Award class="size-4" />
					<span>Prelims Mock Exam (-0.66)</span>
				</Button>

				{#if data.summary}
					<div class="flex shrink-0 flex-col items-center rounded-xl border border-border bg-card/80 px-4 py-2.5 text-center shadow-xs">
						<Flame class="size-4 text-primary animate-pulse" />
						<span class="font-mono text-xl font-semibold leading-tight omr-bubble">{data.summary.streak}</span>
						<span class="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">day streak</span>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<!-- Main 2-Column Layout: Subject Tree & Active Quiz Arena -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
		<!-- Left: Subject & Sub-tree Explorer -->
		<div class="lg:col-span-5 space-y-4">
			<SubjectTree
				filters={data.filters}
				selectedSubject={subject}
				selectedSubTopic={subTopic}
				onSelect={handleTreeSelect}
			/>

			{#if data.nemesis}
				<div class="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-xs">
					<div class="flex items-center gap-2 text-muted-foreground">
						<span class="text-base">{data.nemesis.avatar}</span>
						<span>
							<span class="font-medium text-foreground">{data.nemesis.name}</span> is at <span class="font-mono">{Math.round(data.nemesis.accuracy * 100)}%</span>
						</span>
					</div>
					<a href="/nemesis" class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
						Rival dossier <ArrowRight class="size-3.5" />
					</a>
				</div>
			{/if}
		</div>

		<!-- Right: Active Quiz Arena -->
		<div class="lg:col-span-7 space-y-6">
			<div class="rounded-xl border border-border/70 bg-card p-6 shadow-sm space-y-5">
				<div class="flex items-center justify-between border-b border-border/40 pb-3">
					<div class="flex items-center gap-2">
						<span class="text-xs font-mono font-semibold uppercase tracking-wider text-primary">Active Quiz Session</span>
						<span class="rounded bg-muted px-2 py-0.5 font-mono text-[11px] font-medium">{activeLabel}</span>
					</div>
					{#if busy}
						<span class="text-xs font-mono text-muted-foreground animate-pulse">Loading pool...</span>
					{/if}
				</div>

				<QuickQuiz
					questions={pool}
					quizId={`quick-${subject}-${subTopic}`}
					emoji="⚡"
					title="Round"
					perRound={10}
					nemesisStats={data.nemesisStats}
					nemesisName={data.nemesisName}
					nemesisUserId={data.nemesisUserId}
					userName={data.userName}
				/>
			</div>

			<!-- Quick Navigation Links -->
			<div class="grid grid-cols-2 gap-3">
				<a href="/decks" class="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted/40 shadow-xs">
					<BookOpen class="size-4 shrink-0 text-primary" />
					<span class="text-left">
						<span class="block text-sm font-semibold">Quiz Flashcards</span>
						<span class="block text-xs font-normal text-muted-foreground">{data.decks.length} subject decks</span>
					</span>
				</a>
				<a href="/dashboard" class="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted/40 shadow-xs">
					<LineChart class="size-4 shrink-0 text-primary" />
					<span class="text-left">
						<span class="block text-sm font-semibold">Dashboard</span>
						<span class="block text-xs font-normal text-muted-foreground">radar · streaks · sessions</span>
					</span>
				</a>
			</div>
		</div>
	</div>
</div>
