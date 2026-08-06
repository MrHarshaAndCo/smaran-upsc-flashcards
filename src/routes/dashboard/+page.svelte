<script>
	import { invalidateAll } from '$app/navigation';
	import { Flame, Target, Clock3, Trophy, Swords, BookOpen, PenLine, Smartphone, ArrowRight } from 'lucide-svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import NemesisDossier from '$lib/components/NemesisDossier.svelte';
	import RadarChart from '$lib/components/RadarChart.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';

	let { data } = $props();

	const accuracy = $derived(data.summary.total === 0 ? 0 : (data.summary.correct / data.summary.total) * 100);

	const SHORT = {
		polity: 'Polity',
		'modern-history': 'History',
		geography: 'Geography',
		'art-culture': 'Culture',
		economy: 'Economy'
	};

	const radarLabels = $derived(data.summary.perDeck.map((d) => SHORT[d.deckId] ?? d.title));
	const radarValues = $derived(data.summary.perDeck.map((d) => (d.total === 0 ? 0 : Math.round((d.correct / d.total) * 100))));
	const radarRoom = $derived(data.summary.perDeck.map((d) => (data.roomDeckAccuracy[d.deckId] == null ? 0 : Math.round(data.roomDeckAccuracy[d.deckId] * 100))));

	let newDeviceId = $state('');
	let newPlatform = $state('android');
	let deviceBusy = $state(false);
	let deviceError = $state('');

	async function registerDevice(e) {
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
		} catch (err) {
			deviceError = err.message;
		}
		deviceBusy = false;
	}

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	function fmt(ts) {
		const d = new Date(ts);
		return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
	}

	const scoreTone = (rate) => (rate >= 0.7 ? 'text-green-600' : rate >= 0.4 ? 'text-amber-600' : 'text-red-600');
</script>

<div class="space-y-8 pt-6">
	<!-- Header -->
	<div class="flex flex-wrap items-end justify-between gap-2">
		<div>
			<p class="text-sm font-medium text-primary">Student dashboard</p>
			<h1 class="text-3xl font-bold tracking-tight">Welcome back, {data.user.name}</h1>
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
			<p class="mt-1 text-2xl font-bold">{Math.round(accuracy)}%</p>
			<p class="text-xs text-muted-foreground">{data.summary.correct}/{data.summary.total} reviews</p>
		</Card>
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Streak</p>
				<Flame class="size-4 text-orange-500" />
			</div>
			<p class="mt-1 text-2xl font-bold">{data.summary.streak}</p>
			<p class="text-xs text-muted-foreground">correct in a row</p>
		</Card>
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Due now</p>
				<Clock3 class="size-4 text-muted-foreground" />
			</div>
			<p class="mt-1 text-2xl font-bold">{data.summary.dueCount}</p>
			<p class="text-xs text-muted-foreground">cards the scheduler wants back</p>
		</Card>
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top of board</p>
				<Trophy class="size-4 text-amber-500" />
			</div>
			<p class="mt-1 text-2xl font-bold">{data.leader ? `${data.leader.avatar} ${Math.round(data.leader.accuracy * 100)}%` : '—'}</p>
			<p class="text-xs text-muted-foreground">{data.leader?.name === data.user.name ? 'That is you.' : `${data.leader?.name ?? '—'} leads`}</p>
		</Card>
	</div>

	<!-- Radar + nemesis -->
	<div class="grid gap-6 lg:grid-cols-2">
		<Card class="p-6">
			<div class="mb-2 flex items-center gap-2">
				<Target class="size-4 text-primary" />
				<h2 class="text-lg font-bold">Subject radar</h2>
			</div>
			<p class="mb-4 text-xs text-muted-foreground">Your accuracy per subject vs the room average</p>
			<RadarChart labels={radarLabels} values={radarValues} bestValues={radarRoom} bestLabel={data.user.name} />
		</Card>

		<div class="space-y-6">
			{#if data.nemesis}
				<div>
					<div class="mb-3 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Swords class="size-4 text-primary" />
							<h2 class="text-lg font-bold">Your rivalry</h2>
						</div>
						<a href="/nemesis" class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
							Dossier <ArrowRight class="size-3.5" />
						</a>
					</div>
					<NemesisDossier nemesis={data.nemesis.nemesis} record={data.nemesis.record} taunt={data.nemesis.taunt} compact />
				</div>
			{/if}
			<div>
				<div class="mb-3 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<BookOpen class="size-4 text-primary" />
						<h2 class="text-lg font-bold">Deck by deck</h2>
					</div>
					<a href="/decks" class="text-xs text-muted-foreground hover:text-foreground">All decks →</a>
				</div>
				<Card class="divide-y">
					{#each data.summary.perDeck as d (d.deckId)}
						<div class="p-3.5">
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium">{d.emoji} {d.title}</span>
								<span class="text-muted-foreground">{d.correct}/{d.total}</span>
							</div>
							<div class="mt-2 flex items-center gap-3">
								<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
									<div class="h-full rounded-full bg-primary" style={`width: ${d.total === 0 ? 0 : Math.round((d.correct / d.total) * 100)}%`} />
								</div>
								{#if d.due > 0}<span class="text-xs font-medium text-amber-600">{d.due} due</span>{:else}<span class="text-xs text-muted-foreground">clear</span>{/if}
							</div>
						</div>
					{/each}
				</Card>
			</div>
		</div>
	</div>

	<!-- Activity: sessions + quizzes -->
	<div class="grid gap-6 lg:grid-cols-2">
		<section>
			<div class="mb-3 flex items-center gap-2">
				<PenLine class="size-4 text-primary" />
				<h2 class="text-lg font-bold">Recent quizzes</h2>
			</div>
			<Card class="divide-y">
				{#if data.quizSessions.length === 0}
					<p class="p-6 text-center text-sm text-muted-foreground">No quiz attempts yet. <a href="/quiz" class="text-primary hover:underline">Take one →</a></p>
				{:else}
					{#each data.quizSessions as q (q.id)}
						<div class="flex items-center justify-between p-3.5">
							<span class="text-sm font-medium">{data.quizTitles[q.quizId]?.emoji ?? '📝'} {data.quizTitles[q.quizId]?.title ?? q.quizId}</span>
							<span class="text-xs text-muted-foreground">{fmt(q.endedAt)} · <span class={`font-semibold ${scoreTone(q.correct / q.total)}`}>{q.correct}/{q.total}</span></span>
						</div>
					{/each}
				{/if}
			</Card>
		</section>

		<section>
			<div class="mb-3 flex items-center gap-2">
				<BookOpen class="size-4 text-primary" />
				<h2 class="text-lg font-bold">Recent sessions</h2>
			</div>
			<Card class="divide-y">
				{#if data.sessions.length === 0}
					<p class="p-6 text-center text-sm text-muted-foreground">No study sessions yet. <a href="/decks" class="text-primary hover:underline">Start one →</a></p>
				{:else}
					{#each data.sessions as s (s.id)}
						<div class="flex items-center justify-between p-3.5">
							<span class="text-sm font-medium">{s.emoji} {s.deckTitle}</span>
							<span class="text-xs text-muted-foreground">{fmt(s.endedAt)} · <span class={`font-semibold ${scoreTone(s.correct / s.total)}`}>{s.correct}/{s.total}</span></span>
						</div>
					{/each}
				{/if}
			</Card>
		</section>
	</div>

	<!-- Devices -->
	<section>
		<div class="mb-3 flex items-center gap-2">
			<Smartphone class="size-4 text-primary" />
			<h2 class="text-lg font-bold">Registered devices</h2>
		</div>
		<Card class="p-4">
			<p class="mb-3 text-sm text-muted-foreground">Paste a tester's device id here so you know who is on which phone.</p>
			<form onsubmit={registerDevice} class="flex flex-col gap-2 sm:flex-row">
				<Input placeholder="Device id (expo-token-…, android-id-…)" bind:value={newDeviceId} maxlength="200" class="flex-1" />
				<select class="h-10 rounded-md border border-input bg-background px-3 text-sm" bind:value={newPlatform}>
					<option value="android">Android</option>
					<option value="ios">iOS</option>
					<option value="web">Web / PWA</option>
				</select>
				<Button type="submit" disabled={deviceBusy || !newDeviceId.trim()}>{deviceBusy ? '…' : 'Register'}</Button>
			</form>
			{#if deviceError}<p class="mt-2 text-sm text-destructive">{deviceError}</p>{/if}
			{#if data.devices.length > 0}
				<div class="mt-4 divide-y">
					{#each data.devices as d (d.deviceId)}
						<div class="flex items-center justify-between gap-3 py-2">
							<span class="rounded bg-muted px-2 py-0.5 text-xs font-medium uppercase">{d.platform}</span>
							<span class="flex-1 truncate font-mono text-xs">{d.deviceId}</span>
							<span class="text-xs text-muted-foreground">since {fmt(d.createdAt)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	</section>

	<!-- Leaderboard -->
	<section>
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Trophy class="size-4 text-primary" />
				<h2 class="text-lg font-bold">Leaderboard</h2>
			</div>
			<a href="/leaderboard" class="text-xs text-muted-foreground hover:text-foreground">Full board →</a>
		</div>
		<Leaderboard entries={data.leaderboard} highlight={data.user.id} />
	</section>
</div>
