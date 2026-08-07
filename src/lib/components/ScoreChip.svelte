<script>
	import { Badge } from '$lib/components/ui/badge';

	let { correct, total } = $props();
	const rate = $derived(total === 0 ? 0 : correct / total);
	const variant = $derived(rate >= 0.7 ? 'success' : rate >= 0.4 ? 'warning' : 'destructive');
</script>

<Badge {variant} class="font-mono font-semibold">{correct}/{total}</Badge>
