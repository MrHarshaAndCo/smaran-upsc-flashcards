<script>
	let { label, value, sub, tone = '' } = $props();
</script>

<div class="rounded-lg border bg-card p-4">
	<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
	<p class="mt-1 text-2xl font-bold" style={tone ? `color: var(--${tone})` : ''}>{value}</p>
	{#if sub}<p class="mt-0.5 text-xs text-muted-foreground">{sub}</p>{/if}
</div>
