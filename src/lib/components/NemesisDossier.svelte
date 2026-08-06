<script>
	let { nemesis, record, taunt, compact = false } = $props();
</script>

<div class="dossier">
	<div class="d-head">
		<div>
			<div class="eyebrow" style="color: var(--saffron)">Nemesis dossier</div>
			<div class="d-name">{nemesis.avatar} {nemesis.name}</div>
			{#if !compact}
				<div class="small muted" style="color: rgba(246,241,228,.65)">
					{Math.round(nemesis.accuracy * 100)}% overall · {nemesis.reviews} reviews
				</div>
			{/if}
		</div>
		<span class="stamp">Rival · Active</span>
	</div>
	<div class="d-record">
		<div class="cell"><div class="num">{record.win}</div><div class="lab">You lead</div></div>
		<div class="cell"><div class="num">{record.loss}</div><div class="lab">They lead</div></div>
		<div class="cell"><div class="num">{record.draw}</div><div class="lab">Dead even</div></div>
	</div>
	<p class="taunt">“{taunt}”</p>
</div>
