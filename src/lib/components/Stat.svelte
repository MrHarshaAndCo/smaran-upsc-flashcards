<script>
	let { label, value, sub, tone = '' } = $props();
</script>

<div class="rounded-md border border-border bg-card p-4">
	<p class="eyebrow text-muted-foreground">{label}</p>
	<p class="font-mono mt-1 text-2xl font-semibold tracking-tight" class:omr-bubble={true} style={tone ? `color: var(--${tone})` : ''}>{value}</p>
	{#if sub}<p class="mt-0.5 text-xs text-muted-foreground">{sub}</p>{/if}
</div>
