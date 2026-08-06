<script>
	import { Swords } from 'lucide-svelte';
	import NemesisDossier from '$lib/components/NemesisDossier.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { cardDuelLine, h2hRecord } from '$lib/engine/nemesis.js';

	let { data } = $props();
</script>

<div class="mx-auto max-w-3xl space-y-10 pt-8">
	{#if !data.nemesis}
		<div class="py-16 text-center">
			<h1 class="font-display text-3xl font-semibold tracking-tight">No rival yet</h1>
			<p class="mx-auto mt-2 max-w-md text-muted-foreground">
				Smaran pairs you with the student whose accuracy is closest to yours — the person
				worth beating. Review a few cards and a rival will be assigned.
			</p>
			<a href="/decks" class="mt-6 inline-block"><Button size="lg">Start studying</Button></a>
		</div>
	{:else}
		<div>
			<div class="flex items-center gap-2">
				<Swords class="size-5 text-primary" />
				<h1 class="font-display text-3xl font-semibold tracking-tight">The rivalry</h1>
			</div>
		</div>

		<NemesisDossier nemesis={data.nemesis.nemesis} record={data.nemesis.record} taunt={data.nemesis.taunt} />

		<section>
			<h2 class="mb-4 text-2xl font-bold">Deck ledger</h2>
			<Card class="divide-y">
				{#each data.nemesis.decks as d (d.deckId)}
					{@const r = h2hRecord({ myCorrect: d.myCorrect, myTotal: d.myTotal, theirCorrect: d.theirCorrect, theirTotal: d.theirTotal })}
					<div class="flex items-center justify-between p-4 text-sm">
						<span class="font-medium">{d.emoji} {d.deckTitle}</span>
						<span class="text-muted-foreground">{d.myCorrect}/{d.myTotal} vs {d.theirCorrect}/{d.theirTotal}</span>
						<span class={`rounded-full px-2 py-0.5 text-xs font-medium ${r.outcome === 'win' ? 'bg-green-100 text-green-700' : r.outcome === 'loss' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
							{r.outcome === 'win' ? 'You lead' : r.outcome === 'loss' ? 'They lead' : 'Even'}
						</span>
					</div>
				{/each}
			</Card>
		</section>

		<section>
			<h2 class="mb-4 text-2xl font-bold">Card-by-card duels</h2>
			<Card class="divide-y">
				{#if data.duels.length === 0}
					<p class="p-6 text-center text-sm text-muted-foreground">
						No shared cards yet — study {data.nemesis.nemesis.name}'s decks to open the ledger.
					</p>
				{:else}
					{#each data.duels as duel (duel.cardId)}
						{@const win = duel.myCorrect / duel.myTotal > duel.theirCorrect / duel.theirTotal}
						{@const loss = duel.myCorrect / duel.myTotal < duel.theirCorrect / duel.theirTotal}
						<div class="flex items-center gap-3 p-4">
							<span class={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${win ? 'bg-green-100 text-green-700' : loss ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
								{win ? '✓' : loss ? '✗' : '='}
							</span>
							<p class="text-sm">
								{cardDuelLine({
									front: duel.front.slice(0, 90) + (duel.front.length > 90 ? '…' : ''),
									myCorrect: duel.myCorrect,
									myTotal: duel.myTotal,
									theirCorrect: duel.theirCorrect,
									theirTotal: duel.theirTotal
								})}
							</p>
						</div>
					{/each}
				{/if}
			</Card>
		</section>
	{/if}
</div>
