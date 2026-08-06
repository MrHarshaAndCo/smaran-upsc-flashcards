<script>
	import { invalidateAll } from '$app/navigation';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import NemesisDossier from '$lib/components/NemesisDossier.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';

	let { data } = $props();

	const accuracy = $derived(data.summary.total === 0 ? 0 : (data.summary.correct / data.summary.total) * 100);

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

	function fmt(ts) {
		return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
	}
</script>

<div class="space-y-10 pt-8">
	<div class="flex flex-wrap items-end justify-between gap-2">
		<div>
			<p class="text-sm font-medium text-primary">Student dashboard</p>
			<h1 class="text-3xl font-bold tracking-tight">Welcome back, {data.user.name}</h1>
		</div>
		{#if data.rank > 0}
			<p class="text-sm text-muted-foreground">
				Board rank: <span class="font-bold text-foreground">#{data.rank}</span>
			</p>
		{/if}
	</div>

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<Stat label="Accuracy" value={`${Math.round(accuracy)}%`} sub={`${data.summary.correct}/${data.summary.total} reviews`} tone={accuracy >= 70 ? 'green-600' : accuracy >= 40 ? 'amber-600' : 'red-600'} />
		<Stat label="Streak" value={`🔥 ${data.summary.streak}`} sub="in a row" />
		<Stat label="Due now" value={data.summary.dueCount} sub="cards the scheduler wants back" />
		{#if data.leader}
			<Stat label="Top of board" value={`${data.leader.avatar} ${Math.round(data.leader.accuracy * 100)}%`} sub={data.leader.name === data.user.name ? 'That is you.' : `${data.leader.name} leads`} />
		{/if}
	</div>

	{#if data.nemesis}
		<section>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Your rivalry</h2>
				<a href="/nemesis" class="text-sm text-muted-foreground hover:text-foreground">Dossier →</a>
			</div>
			<NemesisDossier nemesis={data.nemesis.nemesis} record={data.nemesis.record} taunt={data.nemesis.taunt} compact />
		</section>
	{/if}

	<div class="grid gap-10 lg:grid-cols-2">
		<section>
			<h2 class="mb-4 text-2xl font-bold">Deck by deck</h2>
			<Card class="divide-y">
				{#each data.summary.perDeck as d (d.deckId)}
					<div class="p-4">
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
		</section>

		<section>
			<h2 class="mb-4 text-2xl font-bold">Recent sessions</h2>
			<Card class="divide-y">
				{#if data.sessions.length === 0}
					<p class="p-6 text-center text-sm text-muted-foreground">
						No sessions yet. <a href="/decks" class="text-primary hover:underline">Start your first →</a>
					</p>
				{:else}
					{#each data.sessions as s (s.id)}
						<div class="flex items-center justify-between p-4">
							<span class="text-sm font-medium">{s.emoji} {s.deckTitle}</span>
							<span class="text-xs text-muted-foreground">{fmt(s.endedAt)} · <span class="font-medium {s.correct / s.total >= 0.7 ? 'text-green-600' : s.correct / s.total >= 0.4 ? 'text-amber-600' : 'text-red-600'}">{s.correct}/{s.total}</span></span>
						</div>
					{/each}
				{/if}
			</Card>
		</section>
	</div>

	<section>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-2xl font-bold">Recent quizzes</h2>
			<a href="/quiz" class="text-sm text-muted-foreground hover:text-foreground">Quiz hall →</a>
		</div>
		<Card class="divide-y">
			{#if data.quizSessions.length === 0}
				<p class="p-6 text-center text-sm text-muted-foreground">
					No quiz attempts yet. <a href="/quiz" class="text-primary hover:underline">Take one →</a>
				</p>
			{:else}
				{#each data.quizSessions as q (q.id)}
					<div class="flex items-center justify-between p-4">
						<span class="text-sm font-medium">{data.quizTitles[q.quizId]?.emoji ?? '📝'} {data.quizTitles[q.quizId]?.title ?? q.quizId}</span>
						<span class="text-xs text-muted-foreground">{fmt(q.endedAt)} · <span class="font-medium {q.correct / q.total >= 0.7 ? 'text-green-600' : q.correct / q.total >= 0.4 ? 'text-amber-600' : 'text-red-600'}">{q.correct}/{q.total}</span></span>
					</div>
				{/each}
			{/if}
		</Card>
	</section>

	<section>
		<h2 class="mb-4 text-2xl font-bold">Registered devices</h2>
		<Card class="p-4">
			<p class="mb-3 text-sm text-muted-foreground">
				Paste a tester's device id here so you know who is on which phone.
			</p>
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

	<section>
		<h2 class="mb-4 text-2xl font-bold">Leaderboard</h2>
		<Leaderboard entries={data.leaderboard} highlight={data.user.id} />
	</section>
</div>
