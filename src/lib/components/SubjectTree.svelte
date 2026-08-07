<script lang="ts">
	import { Search, ChevronDown, ChevronRight, FolderTree, CheckCircle2 } from 'lucide-svelte';

	interface SubTopic {
		name: string;
		count: number;
	}

	interface SubjectFilter {
		subject: string;
		count: number;
		subTopics: SubTopic[];
	}

	let {
		filters = [],
		selectedSubject = 'all',
		selectedSubTopic = 'all',
		onSelect
	}: {
		filters: SubjectFilter[];
		selectedSubject: string;
		selectedSubTopic: string;
		onSelect: (sel: { subject: string; subTopic: string }) => void;
	} = $props();

	let searchQuery = $state('');
	let expandedMap = $state<Record<string, boolean>>({});

	const subjectIcons: Record<string, string> = {
		'Indian Polity': '🏛️',
		'Modern History': '🕰️',
		'Geography': '🗺️',
		'Environment & Ecology': '🌿',
		'Economy': '📈',
		'Art & Culture': '🏺',
		'Science & Technology': '🧪',
		'General Studies': '📚'
	};

	function getEmoji(subject: string): string {
		return subjectIcons[subject] || '📖';
	}

	function isExpanded(subject: string): boolean {
		return expandedMap[subject] ?? true;
	}

	function toggleExpand(subject: string, e: MouseEvent) {
		e.stopPropagation();
		expandedMap[subject] = !(expandedMap[subject] ?? true);
	}

	function expandAll() {
		const next: Record<string, boolean> = {};
		for (const f of filters) next[f.subject] = true;
		expandedMap = next;
	}

	function collapseAll() {
		const next: Record<string, boolean> = {};
		for (const f of filters) next[f.subject] = false;
		expandedMap = next;
	}

	const totalQuestions = $derived(filters.reduce((acc, f) => acc + f.count, 0));

	const filteredTree = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return filters;

		return filters
			.map((f) => {
				const subjectMatches = f.subject.toLowerCase().includes(q);
				const matchingSubTopics = f.subTopics.filter((st) => st.name.toLowerCase().includes(q));

				if (subjectMatches) return f;
				if (matchingSubTopics.length > 0) {
					return { ...f, subTopics: matchingSubTopics };
				}
				return null;
			})
			.filter((f): f is SubjectFilter => f !== null);
	});
</script>

<div class="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-sm space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
		<div class="flex items-center gap-2">
			<div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<FolderTree class="size-4" />
			</div>
			<div>
				<h3 class="font-display text-sm font-semibold tracking-tight">Subject & Sub-tree Index</h3>
				<p class="text-[11px] text-muted-foreground">{totalQuestions.toLocaleString('en-IN')} questions across {filters.length} subjects</p>
			</div>
		</div>

		<div class="flex items-center gap-1 text-[11px]">
			<button
				type="button"
				onclick={expandAll}
				class="rounded px-2 py-0.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
			>
				Expand
			</button>
			<span class="text-muted-foreground/40">·</span>
			<button
				type="button"
				onclick={collapseAll}
				class="rounded px-2 py-0.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
			>
				Collapse
			</button>
		</div>
	</div>

	<!-- Search bar -->
	<div class="relative">
		<Search class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search subject or sub-topic..."
			class="w-full rounded-lg border border-input bg-background/80 py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
		/>
	</div>

	<!-- Root Selection: All Subjects -->
	<div
		role="button"
		tabindex="0"
		onclick={() => onSelect({ subject: 'all', subTopic: 'all' })}
		onkeydown={(e) => e.key === 'Enter' && onSelect({ subject: 'all', subTopic: 'all' })}
		class="group flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-xs transition-all {selectedSubject === 'all' ? 'border-primary bg-primary/10 font-semibold text-primary shadow-xs' : 'border-input/70 bg-background/50 hover:bg-muted/60 text-foreground'}"
	>
		<div class="flex items-center gap-2">
			<span class="text-sm">⚡</span>
			<span>All Subjects (Mixed Grand Test)</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-medium opacity-80">{totalQuestions}</span>
			{#if selectedSubject === 'all'}
				<CheckCircle2 class="size-3.5 text-primary" />
			{/if}
		</div>
	</div>

	<!-- Subject Tree list -->
	<div class="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
		{#if filteredTree.length === 0}
			<p class="py-6 text-center text-xs text-muted-foreground">No subjects match "{searchQuery}"</p>
		{:else}
			{#each filteredTree as f (f.subject)}
				{@const expanded = isExpanded(f.subject)}
				{@const isSubjectSelected = selectedSubject === f.subject && selectedSubTopic === 'all'}
				{@const isAnyChildSelected = selectedSubject === f.subject}

				<div class="rounded-lg border transition-all {isAnyChildSelected ? 'border-primary/40 bg-card' : 'border-border/40 bg-background/40'}">
					<!-- Subject Parent Node -->
					<div
						role="button"
						tabindex="0"
						onclick={() => onSelect({ subject: f.subject, subTopic: 'all' })}
						onkeydown={(e) => e.key === 'Enter' && onSelect({ subject: f.subject, subTopic: 'all' })}
						class="flex cursor-pointer items-center justify-between p-2 text-xs transition-colors hover:bg-muted/40 {isSubjectSelected ? 'font-semibold text-primary' : ''}"
					>
						<div class="flex items-center gap-2 min-w-0">
							<button
								type="button"
								onclick={(e) => toggleExpand(f.subject, e)}
								class="flex size-5 shrink-0 items-center justify-center rounded hover:bg-muted text-muted-foreground"
								aria-label="Toggle subtopics"
							>
								{#if expanded}
									<ChevronDown class="size-3.5" />
								{:else}
									<ChevronRight class="size-3.5" />
								{/if}
							</button>

							<span class="text-sm shrink-0">{getEmoji(f.subject)}</span>
							<span class="truncate">{f.subject}</span>
						</div>

						<div class="flex items-center gap-1.5 shrink-0 ml-2">
							<span class="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">{f.count}</span>
							{#if isSubjectSelected}
								<CheckCircle2 class="size-3.5 text-primary" />
							{/if}
						</div>
					</div>

					<!-- Subtopics Child Nodes (Sub-tree) -->
					{#if expanded && f.subTopics.length > 0}
						<div class="ml-4 border-l border-primary/20 pl-2 pr-2 pb-2 pt-0.5 space-y-1">
							{#each f.subTopics as st (st.name)}
								{@const isSubSelected = selectedSubject === f.subject && selectedSubTopic === st.name}
								<div
									role="button"
									tabindex="0"
									onclick={() => onSelect({ subject: f.subject, subTopic: st.name })}
									onkeydown={(e) => e.key === 'Enter' && onSelect({ subject: f.subject, subTopic: st.name })}
									class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1 text-[11px] transition-colors {isSubSelected ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
								>
									<span class="truncate">└─ {st.name}</span>
									<div class="flex items-center gap-1 shrink-0 ml-2">
										<span class="font-mono text-[10px] opacity-75">({st.count})</span>
										{#if isSubSelected}
											<CheckCircle2 class="size-3 text-primary-foreground" />
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
