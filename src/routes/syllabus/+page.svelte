<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { FolderTree, Sparkles, Award, ArrowRight, BookOpen, Layers } from 'lucide-svelte';
	import SubjectTree from '$lib/components/SubjectTree.svelte';
	import PrelimsMockSimulator from '$lib/components/PrelimsMockSimulator.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';

	let { data } = $props();

	let selectedSubject = $state('all');
	let selectedSubTopic = $state('all');
	let showMockSimulator = $state(false);

	function handleTreeSelect(selection: { subject: string; subTopic: string }) {
		selectedSubject = selection.subject;
		selectedSubTopic = selection.subTopic;
	}

	function launchMockExam() {
		if (!data.pool || data.pool.length === 0) {
			toast.error('No questions loaded for mock exam');
			return;
		}
		showMockSimulator = true;
	}
</script>

{#if showMockSimulator}
	<PrelimsMockSimulator
		questions={data.pool}
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
		<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
			<div>
				<div class="flex items-center gap-2">
					<span class="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary border border-primary/20">
						<FolderTree class="size-3.5" />
						UPSC PRELIMS SYLLABUS INDEX
					</span>
				</div>
				<h1 class="font-display mt-2 text-3xl font-bold tracking-tight text-foreground">Syllabus Directory & Topic Tree</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					{data.questionTotal.toLocaleString('en-IN')} total questions across 6 core subjects · Explore sub-trees or launch topic drills
				</p>
			</div>

			<div class="flex items-center gap-3">
				<!-- Launch Mixed Grand Test -->
				<a href="/decks">
					<Button variant="outline" class="gap-1.5 font-semibold text-xs border-primary/40 hover:bg-primary/10">
						<Sparkles class="size-4 text-primary" />
						<span>Mixed Grand Test</span>
					</Button>
				</a>

				<!-- Launch Prelims Mock Simulator -->
				<Button onclick={launchMockExam} class="gap-1.5 font-semibold text-xs bg-primary text-primary-foreground shadow-xs">
					<Award class="size-4" />
					<span>Prelims Mock Exam (-0.66)</span>
				</Button>
			</div>
		</div>
	</header>

	<!-- Main 2-Column Layout -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
		<!-- Left / Main: Subject & Sub-tree Syllabus Index -->
		<div class="lg:col-span-7 space-y-6">
			<Card class="p-6 border border-border/80 bg-card space-y-4 shadow-sm">
				<div class="flex items-center justify-between border-b border-border/40 pb-3">
					<h2 class="font-display text-lg font-semibold tracking-tight flex items-center gap-2">
						<Layers class="size-4 text-primary" />
						<span>Interactive Syllabus Tree</span>
					</h2>
					<span class="text-xs font-mono text-muted-foreground">{data.filters.length} Subjects</span>
				</div>

				<SubjectTree
					filters={data.filters}
					selectedSubject={selectedSubject}
					selectedSubTopic={selectedSubTopic}
					onSelect={handleTreeSelect}
				/>
			</Card>
		</div>

		<!-- Right: Subject Info & Quick Launcher -->
		<div class="lg:col-span-5 space-y-6">
			<!-- Selected Subject Action Card -->
			<Card class="p-6 border border-border bg-card space-y-5 shadow-sm">
				<div class="space-y-1">
					<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Selected Syllabus Node</span>
					<h3 class="font-display text-xl font-bold text-foreground">
						{selectedSubject === 'all' ? 'All Subjects (Grand Syllabus)' : selectedSubject}
					</h3>
					<p class="text-xs text-muted-foreground">
						{selectedSubTopic === 'all' ? 'Entire Subject Syllabus' : `Sub-topic: ${selectedSubTopic}`}
					</p>
				</div>

				<div class="rounded-xl bg-muted/40 p-4 border border-border/40 space-y-3">
					<div class="flex items-center justify-between text-xs">
						<span class="text-muted-foreground">Question Pool</span>
						<span class="font-mono font-bold text-foreground">Available</span>
					</div>
					<div class="flex items-center justify-between text-xs">
						<span class="text-muted-foreground">MCQ Format</span>
						<span class="font-mono font-bold text-green-600">4-Option (A, B, C, D)</span>
					</div>
				</div>

				<div class="space-y-2.5">
					<a href={`/decks?subject=${encodeURIComponent(selectedSubject)}&subTopic=${encodeURIComponent(selectedSubTopic)}`} class="block w-full">
						<Button class="w-full gap-2 font-semibold bg-primary">
							<Sparkles class="size-4" />
							<span>Start MCQ Quiz on this Topic</span>
						</Button>
					</a>

					<a href={`/study`} class="block w-full">
						<Button variant="outline" class="w-full gap-2 text-xs">
							<BookOpen class="size-4 text-primary" />
							<span>Subject-Wise Study Hub</span>
						</Button>
					</a>
				</div>
			</Card>

			<!-- Nemesis Status Widget -->
			{#if data.nemesis}
				<Card class="p-5 border border-border/80 bg-card space-y-3 shadow-xs">
					<div class="flex items-center justify-between">
						<span class="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Rival Dossier</span>
						<a href="/nemesis" class="text-xs font-medium text-primary hover:underline flex items-center gap-1">
							View <ArrowRight class="size-3" />
						</a>
					</div>
					<div class="flex items-center gap-3">
						<span class="text-2xl">{data.nemesis.avatar}</span>
						<div>
							<p class="font-bold text-sm">{data.nemesis.name}</p>
							<p class="text-xs text-muted-foreground font-mono">{Math.round(data.nemesis.accuracy * 100)}% accuracy baseline</p>
						</div>
					</div>
				</Card>
			{/if}
		</div>
	</div>
</div>
