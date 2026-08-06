<script>
	import NemesisDossier from '$lib/components/NemesisDossier.svelte';
	import { cardDuelLine, h2hRecord } from '$lib/engine/nemesis.js';

	let { data } = $props();
</script>

<div class="wrap" style="padding-top: 40px; max-width: 900px">
	{#if !data.nemesis}
		<div class="gate">
			<p class="eyebrow">Nemesis system</p>
			<h1>No rival yet</h1>
			<p class="muted">
				Smaran pairs you with the student whose accuracy is closest to yours — the person
				worth beating. Review a few cards and a rival will be assigned from the board.
			</p>
			<div style="margin-top: 20px">
				<a class="btn btn-primary" href="/decks">Start studying</a>
			</div>
		</div>
	{:else}
		<p class="eyebrow">Nemesis system</p>
		<h1 style="margin-bottom: 18px">The rivalry</h1>

		<NemesisDossier nemesis={data.nemesis.nemesis} record={data.nemesis.record} taunt={data.nemesis.taunt} />

		<section class="section">
			<div class="section-head"><h2>Deck ledger</h2></div>
			<div class="card">
				<table class="table">
					<thead>
						<tr>
							<th>Deck</th>
							<th>You</th>
							<th>{data.nemesis.nemesis.name}</th>
							<th>Edge</th>
						</tr>
					</thead>
					<tbody>
						{#each data.nemesis.decks as d (d.deckId)}
							{@const r = h2hRecord({ myCorrect: d.myCorrect, myTotal: d.myTotal, theirCorrect: d.theirCorrect, theirTotal: d.theirTotal })}
							<tr>
								<td>{d.emoji} <strong>{d.deckTitle}</strong></td>
								<td>{d.myCorrect}/{d.myTotal}</td>
								<td>{d.theirCorrect}/{d.theirTotal}</td>
								<td>
									<span class="chip {r.outcome === 'win' ? 'good' : r.outcome === 'loss' ? 'bad' : 'flat'}">
										{r.outcome === 'win' ? 'You lead' : r.outcome === 'loss' ? 'They lead' : 'Even'}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<section class="section">
			<div class="section-head"><h2>Card-by-card duels</h2></div>
			<div class="card">
				{#if data.duels.length === 0}
					<div class="empty">No shared cards yet — study {data.nemesis.nemesis.name}'s decks to open the ledger.</div>
				{:else}
					{#each data.duels as duel (duel.cardId)}
						<div class="duel-row">
							<span class="duel-mark {duel.myCorrect / duel.myTotal > duel.theirCorrect / duel.theirTotal ? 'win' : duel.myCorrect / duel.myTotal < duel.theirCorrect / duel.theirTotal ? 'loss' : 'draw'}">
								{duel.myCorrect / duel.myTotal > duel.theirCorrect / duel.theirTotal ? '✓' : duel.myCorrect / duel.myTotal < duel.theirCorrect / duel.theirTotal ? '✗' : '='}
							</span>
							<span style="flex: 1">{cardDuelLine({ front: duel.front.slice(0, 90) + (duel.front.length > 90 ? '…' : ''), myCorrect: duel.myCorrect, myTotal: duel.myTotal, theirCorrect: duel.theirCorrect, theirTotal: duel.theirTotal })}</span>
						</div>
					{/each}
				{/if}
			</div>
		</section>
	{/if}
</div>
