<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		labels,
		values,
		class: className,
		max = 100,
		bestLabel = 'You',
		bestValues = []
	}: {
		labels: string[];
		values: number[];
		class?: string;
		max?: number;
		bestLabel?: string;
		bestValues?: number[];
	} = $props();

	const W = 300;
	const H = 300;
	const CX = W / 2;
	const CY = H / 2;
	const R = 105;
	const N = labels.length;

	function point(i: number, value: number) {
		const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
		const r = (value / max) * R;
		return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
	}

	function ring(frac: number) {
		const pts = labels.map((_, i) => point(i, max * frac));
		return pts.map((p) => p.join(',')).join(' ');
	}

	const polygon = labels.map((_, i) => point(i, values[i] ?? 0).join(',')).join(' ');
	const bestPolygon =
		bestValues.length === N
			? bestValues.map((v, i) => point(i, v).join(',')).join(' ')
			: null;

	const labelPoints = labels.map((_, i) => {
		const [x, y] = point(i, max * 1.12);
		return { x, y, label: labels[i] };
	});
</script>

<svg viewBox={`0 0 ${W} ${H}`} class={cn('mx-auto w-full max-w-xs', className)} role="img" aria-label="Performance radar chart">
	{#each [0.2, 0.4, 0.6, 0.8, 1] as f (f)}
		<polygon points={ring(f)} fill="none" stroke="oklch(0.922 0 0)" stroke-width="1" />
	{/each}
	{#each labels as _, i (i)}
		<line
			x1={CX}
			y1={CY}
			x2={point(i, max)[0]}
			y2={point(i, max)[1]}
			stroke="oklch(0.922 0 0)"
			stroke-width="1"
		/>
	{/each}

	{#if bestPolygon}
		<polygon points={bestPolygon} fill="oklch(0.97 0 0 / 0.8)" stroke="oklch(0.85 0 0)" stroke-width="1.5" stroke-dasharray="4 3" />
	{/if}

	<polygon points={polygon} fill="oklch(0.55 0.18 30 / 0.15)" stroke="oklch(0.55 0.18 30)" stroke-width="2.5" stroke-linejoin="round" />

	{#each labels as _, i (i)}
		<circle cx={point(i, values[i] ?? 0)[0]} cy={point(i, values[i] ?? 0)[1]} r="3.5" fill="oklch(0.55 0.18 30)" />
	{/each}

	{#each labelPoints as lp, i (i)}
		<text x={lp.x} y={lp.y} text-anchor="middle" dominant-baseline="middle" font-size="10" fill="oklch(0.556 0 0)" font-weight="500">
			{lp.label}
		</text>
	{/each}
</svg>

{#if bestPolygon}
	<p class="mt-1 flex items-center justify-center gap-4 text-xs text-muted-foreground">
		<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-primary"></span> {bestLabel}</span>
		<span class="flex items-center gap-1.5"><span class="h-0.5 w-4 rounded border-t-2 border-dashed border-muted-foreground"></span> Room average</span>
	</p>
{/if}
