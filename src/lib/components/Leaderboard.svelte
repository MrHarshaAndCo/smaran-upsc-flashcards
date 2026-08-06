<script>
	import { page } from '$app/state';

	let { entries = [], limit = 0, highlight = null, deckTitle = '' } = $props();
	const shown = $derived(limit > 0 ? entries.slice(0, limit) : entries);

	function rankClass(i) {
		return i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : '';
	}
</script>

{#if shown.length === 0}
	<div class="empty">No one has reviewed {deckTitle ? `“${deckTitle}”` : 'these cards'} yet. Be the first.</div>
{:else}
	<table class="table">
		<thead>
			<tr>
				<th>#</th>
				<th>Student</th>
				<th>Accuracy</th>
				<th>Reviews</th>
				<th>Streak</th>
			</tr>
		</thead>
		<tbody>
			{#each shown as entry, i (entry.userId)}
				<tr class:me={entry.userId === highlight || entry.userId === page.data.user?.id}>
					<td><span class="rank {rankClass(i)}">{i + 1}</span></td>
					<td>{entry.avatar} <strong>{entry.name}</strong>{entry.userId === page.data.user?.id ? ' (you)' : ''}</td>
					<td>{Math.round(entry.accuracy * 100)}%</td>
					<td>{entry.reviews}</td>
					<td>{entry.streak > 0 ? `🔥 ${entry.streak}` : '—'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
