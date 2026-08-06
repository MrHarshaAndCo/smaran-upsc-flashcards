<script>
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let { compact = false, ondone = () => {} } = $props();
	let name = $state('');
	let busy = $state(false);
	let error = $state('');

	async function submit(e) {
		e.preventDefault();
		if (!name.trim() || busy) return;
		busy = true;
		error = '';
		try {
			const r = await fetch('/api/user', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name })
			});
			if (!r.ok) throw new Error('failed');
			await invalidateAll();
			ondone();
		} catch {
			error = 'Could not save your name. Try again.';
		}
		busy = false;
	}
</script>

<form onsubmit={submit} class="flex gap-2">
	<Input placeholder="Your name" bind:value={name} maxlength="24" autocomplete="name" aria-label="Your name" class={compact ? 'h-8' : ''} />
	<Button type="submit" size={compact ? 'sm' : 'default'} disabled={busy || !name.trim()}>
		{busy ? '…' : compact ? 'Join' : 'Start'}
	</Button>
</form>
{#if error}<p class="mt-1 text-xs text-destructive">{error}</p>{/if}
