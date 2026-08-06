<script>
	let { items = [] } = $props();
</script>

{#if items.length > 0}
	<div class="stack">
		{#each items as item (item.title)}
			<div class="feedback {item.tone}">
				{#if item.flag}
					<div class="fb-tag">
						<span class="chip {item.tone === 'good' ? 'good' : item.tone === 'bad' ? 'bad' : 'flat'}">
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
					</div>
				{/if}
				<div class="fb-title">{item.title}</div>
				<div class="fb-body">{item.body}</div>
			</div>
		{/each}
	</div>
{/if}
