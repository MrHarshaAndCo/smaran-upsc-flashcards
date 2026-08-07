<script lang="ts">
	import { page } from '$app/state';
	import { Users, Swords } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	let {
		entries = [],
		limit = 0,
		highlight = null,
		deckTitle = '',
		onChallengeRival = null
	}: {
		entries?: any[];
		limit?: number;
		highlight?: string | null;
		deckTitle?: string;
		onChallengeRival?: ((name: string, userId: string) => void) | null;
	} = $props();

	const shown = $derived(limit > 0 ? entries.slice(0, limit) : entries);
	const meId = $derived(page.data.user?.id);

	const MEDALS = ['text-warning font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-medium'];
</script>

{#if shown.length === 0}
	<p class="py-8 text-center text-sm text-muted-foreground">
		No one has reviewed {deckTitle ? `“${deckTitle}”` : 'these cards'} yet. Be the first.
	</p>
{:else}
	<div class="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
		<table class="w-full text-xs sm:text-sm">
			<thead>
				<tr class="border-b border-border/80 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground font-mono">
					<th class="px-3.5 py-3 font-semibold">Rank</th>
					<th class="px-3.5 py-3 font-semibold">Student</th>
					<th class="px-3.5 py-3 text-right font-semibold">Accuracy</th>
					<th class="px-3.5 py-3 text-right font-semibold">Reviews</th>
					<th class="px-3.5 py-3 text-right font-semibold">Challenge</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border/40">
				{#each shown as entry, i (entry.userId)}
					<tr class="hover:bg-muted/20 transition-colors {entry.userId === highlight || entry.userId === meId ? 'bg-primary/5' : ''}">
						<td class="px-3.5 py-3">
							<span class="font-mono text-xs sm:text-sm {i < 3 ? MEDALS[i] : 'text-muted-foreground'}">#{i + 1}</span>
						</td>
						<td class="px-3.5 py-3 font-medium">
							<span class="text-base mr-1.5">{entry.avatar}</span>
							<span class="text-foreground">{entry.name}</span>
							{#if entry.userId === meId}<span class="text-xs text-muted-foreground font-normal"> (you)</span>{/if}
						</td>
						<td class="font-mono px-3.5 py-3 text-right font-semibold text-foreground">{Math.round(entry.accuracy * 100)}%</td>
						<td class="font-mono px-3.5 py-3 text-right text-muted-foreground">{entry.reviews}</td>
						<td class="px-3.5 py-3 text-right">
							{#if entry.userId !== meId}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onChallengeRival ? onChallengeRival(entry.name, entry.userId) : null}
									class="h-7 px-2 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 hover:bg-amber-500/10 gap-1 font-semibold"
									title={`Trigger Easter Egg Nemesis Duel vs ${entry.name}`}
								>
									<Swords class="size-3.5 text-amber-500" />
									<span>Duel 🥚</span>
								</Button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
