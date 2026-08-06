<script>
	let { correct, total } = $props();
	const rate = $derived(total === 0 ? 0 : correct / total);
	const cls = $derived(rate >= 0.7 ? 'text-green-600' : rate >= 0.4 ? 'text-amber-600' : 'text-red-600');
</script>

<span class={`font-semibold ${cls}`}>{correct}/{total}</span>
