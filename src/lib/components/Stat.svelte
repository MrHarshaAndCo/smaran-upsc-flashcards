<script>
	let { label, value, sub, tone = '' } = $props();
</script>

<div class="stat">
	<div class="label">{label}</div>
	<div class="value" style={tone ? `color: var(--${tone})` : ''}>{value}</div>
	{#if sub}<div class="small muted">{sub}</div>{/if}
</div>
