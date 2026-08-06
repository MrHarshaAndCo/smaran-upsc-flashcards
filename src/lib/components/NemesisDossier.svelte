<script>
	import { Card } from '$lib/components/ui/card';

	let { nemesis, record, taunt, compact = false } = $props();
</script>

<Card class="border-slate-800 bg-slate-950 p-6 text-slate-100">
	<div class="flex items-start justify-between">
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-orange-400">Nemesis dossier</p>
			<h2 class="mt-1 text-2xl font-bold">{nemesis.avatar} {nemesis.name}</h2>
			{#if !compact}
				<p class="mt-1 text-sm text-slate-400">
					{Math.round(nemesis.accuracy * 100)}% overall · {nemesis.reviews} reviews
				</p>
			{/if}
		</div>
		<span class="rounded border border-orange-400/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-orange-400 rotate-3">
			Rival · Active
		</span>
	</div>
	<div class="mt-4 grid grid-cols-3 gap-2">
		<div class="rounded-lg bg-slate-900 p-3 text-center">
			<p class="text-2xl font-bold">{record.win}</p>
			<p class="text-[10px] uppercase tracking-wide text-slate-400">You lead</p>
		</div>
		<div class="rounded-lg bg-slate-900 p-3 text-center">
			<p class="text-2xl font-bold">{record.loss}</p>
			<p class="text-[10px] uppercase tracking-wide text-slate-400">They lead</p>
		</div>
		<div class="rounded-lg bg-slate-900 p-3 text-center">
			<p class="text-2xl font-bold">{record.draw}</p>
			<p class="text-[10px] uppercase tracking-wide text-slate-400">Dead even</p>
		</div>
	</div>
	<p class="mt-4 border-l-2 border-orange-400 pl-3 text-sm italic text-slate-300">“{taunt}”</p>
</Card>
