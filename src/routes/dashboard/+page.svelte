<script>
	import { invalidateAll } from '$app/navigation';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import NemesisDossier from '$lib/components/NemesisDossier.svelte';
	import Stat from '$lib/components/Stat.svelte';

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

<div class="wrap" style="padding-top: 40px">
	<div class="section-head" style="align-items: flex-end">
		<div>
			<p class="eyebrow">Student dashboard</p>
			<h1>Welcome back, {data.user.name}</h1>
		</div>
		{#if data.rank > 0}
			<p class="mono" style="color: var(--slate)">Board rank: <strong style="color: var(--ink)">#{data.rank}</strong> of {data.leaderboard.length + Math.max(0, data.rank - 1)}</p>
		{/if}
	</div>

	<div class="stat-row">
		<Stat label="Accuracy" value={`${Math.round(accuracy)}%`} sub={`${data.summary.correct}/${data.summary.total} reviews`} tone={accuracy >= 70 ? 'laurel' : accuracy >= 40 ? 'gold' : 'brick'} />
		<Stat label="Streak" value={`🔥 ${data.summary.streak}`} sub="correct answers in a row" />
		<Stat label="Due now" value={data.summary.dueCount} sub="cards the scheduler wants back" tone={data.summary.dueCount > 0 ? 'saffron-deep' : ''} />
		{#if data.leader}
			<Stat label="Top of the board" value={`${data.leader.avatar} ${Math.round(data.leader.accuracy * 100)}%`} sub={data.leader.name === data.user.name ? 'That is you.' : `${data.leader.name} holds first`} />
		{/if}
	</div>

	{#if data.nemesis}
		<section class="section">
			<div class="section-head">
				<h2>Your rivalry</h2>
				<a class="small" href="/nemesis">Full dossier →</a>
			</div>
			<NemesisDossier nemesis={data.nemesis.nemesis} record={data.nemesis.record} taunt={data.nemesis.taunt} compact />
		</section>
	{/if}

	<section class="section">
		<div class="section-head">
			<h2>Deck by deck</h2>
		</div>
		<div class="card">
			<table class="table">
				<thead>
					<tr>
						<th>Deck</th>
						<th>Correct</th>
						<th>Accuracy</th>
						<th>Due</th>
					</tr>
				</thead>
				<tbody>
					{#each data.summary.perDeck as d (d.deckId)}
						<tr>
							<td>{d.emoji} <strong>{d.title}</strong></td>
							<td>{d.correct}/{d.total}</td>
							<td style="min-width: 130px">
								<div class="bar"><i style="width: {d.total === 0 ? 0 : Math.round((d.correct / d.total) * 100)}%"></i></div>
							</td>
							<td>
								{#if d.due > 0}<span class="chip warn">{d.due} due</span>{:else}<span class="chip flat">clear</span>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<div class="grid-2 section">
		<section>
			<div class="section-head"><h2>Recent sessions</h2></div>
			<div class="card">
				{#if data.sessions.length === 0}
					<div class="empty">
						<p>No sessions yet.</p>
						<a class="btn btn-primary" href="/decks" style="margin-top: 12px">Start your first</a>
					</div>
				{:else}
					{#each data.sessions as s (s.id)}
						<div class="duel-row">
							<span style="flex: 1">
								<strong>{s.emoji} {s.deckTitle}</strong>
								<span class="muted small"> · {fmt(s.endedAt)}</span>
							</span>
							<span class="chip {s.correct / s.total >= 0.7 ? 'good' : s.correct / s.total >= 0.4 ? 'warn' : 'bad'}">
								{s.correct}/{s.total}
							</span>
						</div>
					{/each}
				{/if}
			</div>
		</section>
		<section>
			<div class="section-head"><h2>Leaderboard</h2><a class="small" href="/leaderboard">Full board →</a></div>
			<Leaderboard entries={data.leaderboard} highlight={data.user.id} />
		</section>
	</div>

	<section class="section">
		<div class="section-head">
			<h2>Recent quizzes</h2>
			<a class="small" href="/quiz">Quiz hall →</a>
		</div>
		<div class="card">
			{#if data.quizSessions.length === 0}
				<div class="empty">
					<p>No quiz attempts yet.</p>
					<a class="btn btn-primary" href="/quiz" style="margin-top: 12px">Take a quiz</a>
				</div>
			{:else}
				{#each data.quizSessions as q (q.id)}
					<div class="duel-row">
						<span style="flex: 1">
							<strong>{data.quizTitles[q.quizId]?.emoji ?? '📝'} {data.quizTitles[q.quizId]?.title ?? q.quizId}</strong>
							<span class="muted small"> · {fmt(q.endedAt)}</span>
						</span>
						<span class="chip {q.correct / q.total >= 0.7 ? 'good' : q.correct / q.total >= 0.4 ? 'warn' : 'bad'}">
							{q.correct}/{q.total}
						</span>
					</div>
				{/each}
			{/if}
		</div>
	</section>

	<section class="section">
		<div class="section-head">
			<h2>Registered devices</h2>
		</div>
		<div class="card">
			<p class="small muted" style="margin-top: 0">
				Paste a tester's device id here (Android/iOS install token or web install id) so you
				know who is on which phone.
			</p>
			<form class="name-form" onsubmit={registerDevice}>
				<input
					class="input"
					style="flex: 1"
					placeholder="Device id (e.g. expo-token-… or android-id-…)"
					aria-label="Device id"
					bind:value={newDeviceId}
					maxlength="200"
				/>
				<select class="input" bind:value={newPlatform} aria-label="Platform">
					<option value="android">Android</option>
					<option value="ios">iOS</option>
					<option value="web">Web / PWA</option>
				</select>
				<button class="btn btn-primary" type="submit" disabled={deviceBusy || !newDeviceId.trim()}>
					{deviceBusy ? '…' : 'Register'}
				</button>
			</form>
			{#if deviceError}<p class="small" style="color: var(--brick); margin: 8px 0 0">{deviceError}</p>{/if}
			{#if data.devices.length === 0}
				<div class="empty" style="padding: 20px">
					<p>No devices registered yet.</p>
				</div>
			{:else}
				<div class="stack" style="margin-top: 14px">
					{#each data.devices as d (d.deviceId)}
						<div class="duel-row">
							<span class="chip {d.platform === 'android' ? 'good' : d.platform === 'ios' ? 'flat' : 'warn'}">{d.platform}</span>
							<span style="flex: 1; font-family: var(--font-mono); font-size: 0.78rem">{d.deviceId}</span>
							<span class="muted small">since {fmt(d.createdAt)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>
