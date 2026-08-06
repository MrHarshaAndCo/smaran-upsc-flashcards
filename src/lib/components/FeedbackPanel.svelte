<script>
	let { items = [] } = $props();

	const toneStyles = {
		good: 'border-l-green-500',
		bad: 'border-l-destructive',
		neutral: 'border-l-muted-foreground'
	};
</script>

{#if items.length > 0}
	<div class="space-y-2">
		{#each items as item (item.title)}
			<div class={`rounded-lg border border-l-4 bg-card p-4 ${toneStyles[item.tone] ?? 'border-l-muted-foreground'}`}>
				{#if item.flag}
					<span class="mb-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
						{item.flag === 'peer-beat'
							? 'You beat the room'
							: item.flag === 'peer-lost'
								? 'Room beat you'
								: item.flag === 'nemesis-beat'
									? 'Rival down'
									: item.flag === 'nemesis-lost'
										? 'Rival up'
										: 'Even'}
					</span>
				{/if}
				<p class="font-medium">{item.title}</p>
				<p class="text-sm text-muted-foreground">{item.body}</p>
			</div>
		{/each}
	</div>
{/if}
