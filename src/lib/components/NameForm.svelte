<script>
	import { invalidateAll } from '$app/navigation';

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

<form class="name-form" onsubmit={submit}>
	<input
		class="input"
		class:small={!compact}
		placeholder="Your name"
		aria-label="Your name"
		bind:value={name}
		maxlength="24"
		autocomplete="name"
	/>
	<button class="btn {compact ? 'btn-dark' : 'btn-primary'}" type="submit" disabled={busy || !name.trim()}>
		{busy ? '…' : compact ? 'Join' : 'Start studying'}
	</button>
</form>
{#if error}<p class="small muted" style="margin:8px 0 0">{error}</p>{/if}
