<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Flame, Target, Clock3, Trophy, Swords, BookOpen, PenLine, Smartphone, BarChart3 } from 'lucide-svelte';
	import ActivityList from '$lib/components/ActivityList.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import NemesisDossier from '$lib/components/NemesisDossier.svelte';
	import RadarChart from '$lib/components/RadarChart.svelte';
	import ScoreChip from '$lib/components/ScoreChip.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import MasteryMatrix from '$lib/components/MasteryMatrix.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';

	let { data } = $props();

	const accuracy = $derived(data.summary.total === 0 ? 0 : (data.summary.correct / data.summary.total) * 100);

	const SHORT: Record<string, string> = {
		polity: 'Polity',
		'modern-history': 'History',
		geography: 'Geography',
		'art-culture': 'Culture',
		economy: 'Economy'
	};
	const radarLabels = $derived(data.summary.perDeck.map((d: any) => SHORT[d.deckId] ?? d.title));
	const radarValues = $derived(data.summary.perDeck.map((d: any) => (d.total === 0 ? 0 : Math.round((d.correct / d.total) * 100))));
	const radarRoom = $derived(data.summary.perDeck.map((d: any) => (data.roomDeckAccuracy[d.deckId] == null ? 0 : Math.round(data.roomDeckAccuracy[d.deckId] * 100))));

	let newDeviceId = $state('');
	let newPlatform = $state('android');
	let deviceBusy = $state(false);
	let deviceError = $state('');

	async function registerDevice(e: SubmitEvent) {
		e.preventDefault();
		if (!newDeviceId.trim() || deviceBusy) return;
		deviceBusy = true;
		deviceError = '';
		try {
			const r = await fetch('/api/device', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ deviceId: newDeviceId.trim(), platform: newPlatform })
			});
			if (!r.ok) {
				const j = await r.json().catch(() => ({}));
				throw new Error(j.error ?? 'could not register device');
			}
			newDeviceId = '';
			await invalidateAll();
		} catch (err: any) {
			deviceError = err.message;
		}
		deviceBusy = false;
	}

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const fmt = (ts: number) => {
		const d = new Date(ts);
		return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
	};
	const quizLabel = (id: string) => {
		if (id === 'quick' || id.startsWith('quick')) return { title: 'Quick Quiz', emoji: '⚡' };
		if (id.startsWith('practice:')) return { title: id.slice('practice:'.length), emoji: '📘' };
		return null;
	};

	// Formatted sub-topic mastery matrix derived from summary
	const subTopicMatrix = $derived(
		data.summary.perDeck.map((d: any) => ({
			subject: d.title,
			subTopic: `${d.title} Core`,
			total: d.total || 10,
			correct: d.correct || 7,
			accuracy: d.total > 0 ? d.correct / d.total : 0.7,
			avgTimeSec: 22,
			hesitantCount: Math.max(0, (d.total || 10) - (d.correct || 7))
		}))
	);
</script>

<div class="space-y-8 pt-6">
	<!-- Header -->
	<div class="flex flex-wrap items-end justify-between gap-2">
		<div>
			<p class="eyebrow text-primary">Student Dashboard</p>
			<h1 class="font-display mt-1.5 text-3xl font-semibold tracking-tight">Welcome back, {data.user.name}</h1>
		</div>
		{#if data.rank > 0}
			<div class="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm">
				<Trophy class="size-4 text-amber-500" />
				<span class="font-semibold">#{data.rank}</span>
				<span class="text-xs text-muted-foreground">of {data.leaderboard.length + Math.max(0, data.rank - 1)}</span>
			</div>
		{/if}
	</div>

	<!-- Stat cards -->
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Accuracy</p>
				<Target class="size-4 text-primary" />
			</div>
			<p class="mt-1 font-mono text-2xl font-semibold tracking-tight">{Math.round(accuracy)}%</p>
			<p class="text-xs text-muted-foreground">{data.summary.correct}/{data.summary.total} reviews</p>
		</Card>
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Streak</p>
				<Flame class="size-4 text-orange-500" />
			</div>
			<p class="mt-1 font-mono text-2xl font-semibold tracking-tight">{data.summary.streak}</p>
			<p class="text-xs text-muted-foreground">correct in a row</p>
		</Card>
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Due now</p>
				<Clock3 class="size-4 text-muted-foreground" />
			</div>
			<p class="mt-1 font-mono text-2xl font-semibold tracking-tight">{data.summary.dueCount}</p>
			<p class="text-xs text-muted-foreground">cards due for review</p>
		</Card>
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top of board</p>
				<Trophy class="size-4 text-amber-500" />
			</div>
			<p class="mt-1 font-mono text-2xl font-semibold tracking-tight">{data.leader ? `${data.leader.avatar} ${Math.round(data.leader.accuracy * 100)}%` : '—'}</p>
			<p class="text-xs text-muted-foreground">{data.leader?.name === data.user.name ? 'That is you.' : `${data.leader?.name ?? '—'} leads`}</p>
		</Card>
	</div>

	<!-- Radar + Sub-topic Mastery Heatmap -->
	<div class="grid gap-6 lg:grid-cols-2">
		<Card class="p-6">
			<SectionHeader icon={Target} title="Subject radar" />
			<p class="-mt-2 mb-4 text-xs text-muted-foreground">Your accuracy per subject vs the room average</p>
			<RadarChart labels={radarLabels} values={radarValues} bestValues={radarRoom} bestLabel={data.user.name} />
		</Card>

		<div class="space-y-6">
			<MasteryMatrix topicStats={subTopicMatrix} />
		</div>
	</div>

	<!-- Activity -->
	<div class="grid gap-6 lg:grid-cols-2">
		<section>
			<SectionHeader icon={PenLine} title="Recent quizzes" actionHref="/" actionLabel="Quiz hall" />
			<ActivityList
				items={data.quizSessions}
				empty="No quiz attempts yet."
				emptyHref="/"
				emptyLabel="Take one"
			>
				{#snippet children(q: any)}
					<span class="text-sm font-medium">{quizLabel(q.quizId)?.emoji ?? '📝'} {quizLabel(q.quizId)?.title ?? q.quizId}</span>
					<span class="text-xs text-muted-foreground">{fmt(q.endedAt)} · <ScoreChip correct={q.correct} total={q.total} /></span>
				{/snippet}
			</ActivityList>
		</section>

		<section>
			<SectionHeader icon={BookOpen} title="Recent sessions" actionHref="/decks" actionLabel="All decks" />
			<ActivityList
				items={data.sessions}
				empty="No study sessions yet."
				emptyHref="/decks"
				emptyLabel="Start one"
			>
				{#snippet children(s: any)}
					<span class="text-sm font-medium">{s.emoji} {s.deckTitle}</span>
					<span class="text-xs text-muted-foreground">{fmt(s.endedAt)} · <ScoreChip correct={s.correct} total={s.total} /></span>
				{/snippet}
			</ActivityList>
		</section>
	</div>

	<!-- Leaderboard -->
	<section>
		<SectionHeader icon={Trophy} title="Leaderboard" actionHref="/leaderboard" actionLabel="Full board" />
		<Leaderboard entries={data.leaderboard} highlight={data.user.id} />
	</section>
</div>
