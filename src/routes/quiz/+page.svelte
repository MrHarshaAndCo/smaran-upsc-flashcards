<script>
	import { toast } from 'svelte-sonner';
	import { BookOpen, BookMarked, Play, Sparkles } from 'lucide-svelte';
	import QuickQuiz from '$lib/components/QuickQuiz.svelte';
	import FeedbackPanel from '$lib/components/FeedbackPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { QuizSession } from '$lib/quiz/session.svelte.js';

	let { data } = $props();

	// ---- Start Quiz tab ----
	let subject = $state('all');
	let subTopic = $state('all');
	let quickQuestions = $state(null);
	let quickBusy = $state(false);

	const questionTotal = $derived(data.filters.reduce((a, f) => a + f.count, 0));
	const currentSubject = $derived(subject === 'all' ? null : data.filters.find((f) => f.subject === subject) ?? null);
	const subTopics = $derived(currentSubject?.subTopics ?? []);
	const subTopicCount = $derived(subject === 'all' ? data.filters.reduce((a, f) => a + f.subTopics.length, 0) : subTopics.length);

	async function startQuick() {
		quickBusy = true;
		try {
			const qs = new URLSearchParams({ limit: '10' });
			if (subject !== 'all') qs.set('subject', subject);
			if (subTopic !== 'all') qs.set('subTopic', subTopic);
			const r = await fetch(`/api/questions?${qs}`);
			const j = await r.json();
			if (!j.questions?.length) {
				toast.error('No questions for that filter yet');
				quickBusy = false;
				return;
			}
			quickQuestions = j.questions.map((q) => ({
				id: q.id,
				question: q.question,
				options: q.options,
				correctIndex: q.answerIndex,
				explanation: q.explanation ?? '',
				subject: q.subject,
				sourceQuiz: q.subject
			}));
		} catch {
			toast.error('Could not load questions');
		}
		quickBusy = false;
	}

	// ---- Study tab ----
	let studySubject = $state(null);
	let studySubTopic = $state('all');
	let practice = $state(null);
	let practiceBusy = $state(false);

	async function startPractice() {
		if (!studySubject) return;
		practiceBusy = true;
		try {
			const qs = new URLSearchParams({ limit: '10' });
			qs.set('subject', studySubject);
			if (studySubTopic !== 'all') qs.set('subTopic', studySubTopic);
			const r = await fetch(`/api/questions?${qs}`);
			const j = await r.json();
			if (!j.questions?.length) {
				toast.error('No questions for that topic yet');
				practiceBusy = false;
				return;
			}
			practice = new QuizSession({
				quiz: {
					id: `practice:${studySubject}`,
					title: studySubject,
					emoji: '📘',
					questions: j.questions.map((q) => ({
						id: q.id,
						question: q.question,
						options: q.options,
						correctIndex: q.answerIndex,
						explanation: q.explanation ?? ''
					}))
				},
				peerStats: {},
				nemesisStats: null,
				nemesisName: null
			});
		} catch (err) {
			toast.error('Practice failed: ' + (err?.message ?? String(err)));
		}
		practiceBusy = false;
	}

	// ---- Resource tab (dummy) ----
	const RESOURCES = [
		{ subject: 'Indian Polity', source: 'NCERT Class XI — Indian Constitution at Work · Laxmikanth (Indian Polity)', note: 'Articles, Parliament, Judiciary' },
		{ subject: 'Modern History', source: 'NCERT Class XII — Modern India · Spectrum (A Brief History of Modern India)', note: '1857 → 1947' },
		{ subject: 'Geography', source: 'NCERT Class XI — Physical/India: Physical Environment · G.C. Leong', note: 'Rivers, climate, physiography' },
		{ subject: 'Art & Culture', source: 'Nitin Singhania (Indian Art & Culture) · CCRT portal', note: 'Dance, architecture, heritage' },
		{ subject: 'Economy', source: 'NCERT Class XI/XII Economics · Economic Survey (current year)', note: 'Budget, banking, growth' }
	];

	const letters = ['A', 'B', 'C', 'D'];
</script>

<div class="space-y-6 pt-6">
	<header class="border-b border-border pb-5">
		<p class="eyebrow text-primary">Question bank</p>
		<h1 class="font-display mt-1.5 text-3xl font-semibold tracking-tight">Quiz</h1>
		<p class="mt-1 text-sm text-muted-foreground">{questionTotal.toLocaleString('en-IN')} real Prelims questions — quick fire, subject practice, or study resources.</p>
	</header>

	<Tabs value="start">
		<TabsList>
			<TabsTrigger value="start">Start Quiz</TabsTrigger>
			<TabsTrigger value="study">Study</TabsTrigger>
			<TabsTrigger value="resource">Study Resource Material</TabsTrigger>
		</TabsList>

		<!-- START QUIZ -->
		<TabsContent value="start" class="space-y-6 pt-6">
			{#if !quickQuestions}
				<Card class="p-6">
					<CardHeader class="px-0 pt-0"><CardTitle class="font-display text-2xl font-semibold tracking-tight">Pick your battlefield</CardTitle></CardHeader>
					<CardContent class="space-y-4 px-0 pb-0">
						<div>
							<p class="eyebrow mb-2 text-muted-foreground">Subject</p>
							<div class="flex flex-wrap gap-2">
								<button onclick={() => (subject = 'all', subTopic = 'all')} class="rounded-full border px-3.5 py-1.5 text-sm font-medium {subject === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-input'}">All subjects</button>
								{#each data.filters as f (f.subject)}
									<button onclick={() => (subject = f.subject, subTopic = 'all')} class="rounded-full border px-3.5 py-1.5 text-sm font-medium {subject === f.subject ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-input'}">
										{f.subject} <span class="font-mono opacity-60">({f.count})</span>
									</button>
								{/each}
							</div>
						</div>
						{#if currentSubject}
							<div>
								<p class="eyebrow mb-2 text-muted-foreground">Sub-topic ({subTopics.length})</p>
								<div class="flex flex-wrap gap-2">
									<button onclick={() => (subTopic = 'all')} class="rounded-full border px-3 py-1 text-xs font-medium {subTopic === 'all' ? 'bg-secondary text-secondary-foreground' : 'bg-background hover:bg-muted border-input'}">All sub-topics</button>
									{#each subTopics as st (st.name)}
										<button onclick={() => (subTopic = st.name)} class="rounded-full border px-3 py-1 text-xs font-medium {subTopic === st.name ? 'bg-secondary text-secondary-foreground' : 'bg-background hover:bg-muted border-input'}">
											{st.name} <span class="font-mono opacity-60">({st.count})</span>
										</button>
									{/each}
								</div>
							</div>
						{/if}
						<Button size="lg" class="w-full" onclick={startQuick} disabled={quickBusy}>
							<Play class="size-4" /> {quickBusy ? 'Loading…' : `Start quiz · 10 random${subject !== 'all' ? ' from ' + subject : ''}`}
						</Button>
					</CardContent>
				</Card>
			{:else}
				<button onclick={() => (quickQuestions = null)} class="text-sm text-muted-foreground hover:text-foreground">← Change filters</button>
				<QuickQuiz questions={quickQuestions} quizId={`quick:${subject}:${subTopic}`} emoji="⚡" title={subject === 'all' ? 'Mixed Quick Quiz' : subject} perRound={10} userName="Aspirant" />
			{/if}
		</TabsContent>

		<!-- STUDY -->
		<TabsContent value="study" class="space-y-6 pt-6">
			{#if practice}
				<button onclick={() => (practice = null)} class="text-sm text-muted-foreground hover:text-foreground">← Back to subjects</button>
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<p class="text-sm font-medium text-primary">📘 {studySubject}</p>
						<p class="text-sm text-muted-foreground">Q {practice.idx + 1} / {practice.questions.length}</p>
					</div>
					<Progress value={practice.idx} max={practice.questions.length} />
					<Card>
						<CardHeader><CardTitle class="text-xl leading-relaxed">{practice.current.question}</CardTitle></CardHeader>
						<CardContent class="flex flex-col gap-2.5">
							{#each practice.current.options as option, i (i)}
								<Button variant={practice.optionVariant(i)} size="lg" class="h-auto w-full justify-start py-3.5 text-left" disabled={practice.answered} onclick={() => practice.choose(i)}>
									<span class="mr-2 font-mono text-sm opacity-70">{letters[i]}</span>
									<span class="whitespace-normal">{option}</span>
								</Button>
							{/each}
						</CardContent>
					</Card>
					{#if practice.answered}
						<div class="space-y-4">
							<FeedbackPanel items={practice.feedback} />
							<Button class="w-full" size="lg" onclick={() => practice.next()}>{practice.idx + 1 < practice.questions.length ? 'Next question' : 'See results'}</Button>
						</div>
					{:else}
						<Button class="w-full" size="lg" disabled={practice.selected === null} onclick={() => practice.check()}>Check answer</Button>
					{/if}
				</div>
			{:else if !studySubject}
				<div class="grid gap-3 sm:grid-cols-2">
					{#each data.filters as f (f.subject)}
						<Card class="cursor-pointer p-5 transition-shadow hover:shadow-md" onclick={() => (studySubject = f.subject, studySubTopic = 'all')}>
							<div class="flex items-center justify-between">
								<span class="font-semibold">{f.subject}</span>
								<span class="font-mono text-xs text-muted-foreground">{f.count} questions</span>
							</div>
							<p class="mt-1 text-xs text-muted-foreground"><span class="font-mono">{f.subTopics.length}</span> sub-topics</p>
						</Card>
					{/each}
				</div>
			{:else}
				<div>
					<button onclick={() => (studySubject = null)} class="text-sm text-muted-foreground hover:text-foreground">← All subjects</button>
					<h2 class="mt-2 text-xl font-bold">{studySubject}</h2>
					<div class="mt-3 flex flex-wrap gap-2">
						<button onclick={() => (studySubTopic = 'all')} class="rounded-full border px-3 py-1 text-xs font-medium {studySubTopic === 'all' ? 'bg-secondary text-secondary-foreground' : 'bg-background hover:bg-muted border-input'}">All sub-topics</button>
						{#each data.filters.find((f) => f.subject === studySubject)?.subTopics ?? [] as st (st.name)}
							<button onclick={() => (studySubTopic = st.name)} class="rounded-full border px-3 py-1 text-xs font-medium {studySubTopic === st.name ? 'bg-secondary text-secondary-foreground' : 'bg-background hover:bg-muted border-input'}">{st.name} <span class="opacity-60">({st.count})</span></button>
						{/each}
					</div>
					<Button class="mt-4" size="lg" onclick={startPractice} disabled={practiceBusy}>
						<BookOpen class="size-4" /> {practiceBusy ? 'Loading…' : `Practice ${studySubject}`}
					</Button>
				</div>
			{/if}
		</TabsContent>

		<!-- RESOURCE (dummy) -->
		<TabsContent value="resource" class="space-y-4 pt-6">
			<div class="flex items-center gap-2 text-muted-foreground">
				<BookMarked class="size-4 text-primary" />
				<p class="text-sm">Recommended sources — dummy list for now, real links coming soon.</p>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each RESOURCES as r (r.subject)}
					<Card class="p-5">
						<div class="flex items-center gap-2"><Sparkles class="size-4 text-primary" /><span class="font-semibold">{r.subject}</span></div>
						<p class="mt-2 text-sm text-muted-foreground">{r.source}</p>
						<p class="mt-1 text-xs text-muted-foreground">{r.note}</p>
					</Card>
				{/each}
			</div>
		</TabsContent>
	</Tabs>
</div>
