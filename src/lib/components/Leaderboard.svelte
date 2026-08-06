<script>
	import { page } from '$app/state';
	import { Users } from 'lucide-svelte';

	let { entries = [], limit = 0, highlight = null, deckTitle = '' } = $props();
	const shown = $derived(limit > 0 ? entries.slice(0, limit) : entries);
	const meId = $derived(page.data.user?.id);

	const MEDALS = ['text-amber-600', 'text-slate-400', 'text-amber-800'];
</script>

{#if shown.length === 0}
	<p class="py-8 text-center text-sm text-muted-foreground">
		No one has reviewed {deckTitle ? `“${deckTitle}”` : 'these cards'} yet. Be the first.
	</p>
{:else}
	<div class="overflow-x-auto rounded-lg border border-border">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
					<th class="px-4 py-2.5 font-medium">#</th>
					<th class="px-4 py-2.5 font-medium">Student</th>
					<th class="px-4 py-2.5 text-right font-medium">Accuracy</th>
					<th class="px-4 py-2.5 text-right font-medium">Reviews</th>
					<th class="px-4 py-2.5 text-right font-medium"></th>
				</tr>
			</thead>
			<tbody>
				{#each shown as entry, i (entry.userId)}
					<tr class="border-b last:border-0 {entry.userId === highlight || entry.userId === meId ? 'bg-primary/5' : ''}">
						<td class="px-4 py-2.5">
							<span class="font-mono text-sm {i < 3 ? MEDALS[i] : 'text-muted-foreground'}">{i + 1}</span>
						</td>
						<td class="px-4 py-2.5">
							{entry.avatar} <span class="font-medium">{entry.name}</span>
							{#if entry.userId === meId}<span class="text-xs text-muted-foreground"> (you)</span>{/if}
						</td>
						<td class="font-mono px-4 py-2.5 text-right font-medium">{Math.round(entry.accuracy * 100)}%</td>
						<td class="font-mono px-4 py-2.5 text-right text-muted-foreground">{entry.reviews}</td>
						<td class="px-4 py-2.5 text-right">
							{#if entry.userId !== meId}
								<a href={`/colab?student=${entry.userId}`} class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground" title={`Compare with ${entry.name}`}>
									<Users class="size-3.5" /> Compare
								</a>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
