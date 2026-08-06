<script>
	import { ArrowRight } from 'lucide-svelte';

	let { icon = null, title, actionHref = null, actionLabel = null } = $props();
</script>

<div class="mb-3 flex items-center justify-between">
	<div class="flex items-center gap-2">
		{#if icon}<svelte:component this={icon} class="size-4 text-primary" />{/if}
		<h2 class="text-lg font-bold">{title}</h2>
	</div>
	{#if actionHref && actionLabel}
		<a href={actionHref} class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
			{actionLabel} <ArrowRight class="size-3.5" />
		</a>
	{/if}
</div>
