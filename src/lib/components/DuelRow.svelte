<script>
	let { myCorrect, myTotal, theirCorrect, theirTotal, children = null } = $props();

	const win = $derived(myTotal > 0 && theirTotal > 0 ? myCorrect / myTotal > theirCorrect / theirTotal : false);
	const loss = $derived(myTotal > 0 && theirTotal > 0 ? myCorrect / myTotal < theirCorrect / theirTotal : false);
	const cls = $derived(win ? 'bg-success/20 text-success' : loss ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground');
	const mark = $derived(win ? '✓' : loss ? '✗' : '=');
</script>

<div class="flex items-center gap-3 p-4">
	<span class={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${cls}`}>{mark}</span>
	<div class="flex-1 text-sm text-foreground">{@render children?.()}</div>
</div>
