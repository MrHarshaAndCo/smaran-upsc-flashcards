<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Card } from '$lib/components/ui/card';

	let {
		items,
		empty,
		emptyHref = null,
		emptyLabel = 'Get started',
		children
	}: {
		items: unknown[];
		empty: string;
		emptyHref?: string | null;
		emptyLabel?: string;
		children?: Snippet;
	} = $props();
</script>

<Card class="divide-y">
	{#if items.length === 0}
		<div class="p-6 text-center text-sm text-muted-foreground">
			{empty}
			{#if emptyHref}
				<br /><a href={emptyHref} class="text-primary hover:underline">{emptyLabel} →</a>
			{/if}
		</div>
	{:else}
		{#each items as item, i (item.id ?? i)}
			<div class="flex items-center justify-between p-3.5">
				{@render children?.(item)}
			</div>
		{/each}
	{/if}
</Card>
