<script>
	let { myCorrect, myTotal, theirCorrect, theirTotal, children = null } = $props();

	const win = $derived(myTotal > 0 && theirTotal > 0 ? myCorrect / myTotal > theirCorrect / theirTotal : false);
	const loss = $derived(myTotal > 0 && theirTotal > 0 ? myCorrect / myTotal < theirCorrect / theirTotal : false);
	const cls = $derived(win ? 'bg-green-100 text-green-700' : loss ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground');
	const mark = $derived(win ? '✓' : loss ? '✗' : '=');
</script>

<div class="flex items-center gap-3 p-4">
	<span class={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${cls}`}>{mark}</span>
	<div class="flex-1 text-sm">{@render children?.()}</div>
</div>
