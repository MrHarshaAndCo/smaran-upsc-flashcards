<script>
	import { UserPlus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let busy = $state(false);
	let error = $state('');

	async function submit(e) {
		e.preventDefault();
		if (busy) return;
		busy = true;
		error = '';
		try {
			const r = await fetch('/api/register', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name, email, password })
			});
			const j = await r.json().catch(() => ({}));
			if (!r.ok) throw new Error(j.error ?? 'Could not create your account.');
			window.location.assign('/');
		} catch (err) {
			error = err.message;
		}
		busy = false;
	}
</script>

<div class="flex min-h-[70vh] items-center justify-center p-4">
	<Card class="w-full max-w-sm">
		<CardHeader class="text-center">
			<CardTitle class="flex items-center justify-center gap-2 text-2xl">
				<UserPlus class="size-5 text-primary" /> Create account
			</CardTitle>
			<CardDescription>Your progress, scores and rivalry live on this account.</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={submit} class="flex flex-col gap-3">
				<div class="flex flex-col gap-1.5">
					<Label for="name">Name</Label>
					<Input id="name" placeholder="How you appear on the board" bind:value={name} maxlength="24" autocomplete="name" />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="you@example.com" bind:value={email} autocomplete="email" />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="password">Password</Label>
					<Input id="password" type="password" placeholder="At least 6 characters" bind:value={password} autocomplete="new-password" />
				</div>
				{#if error}<p class="text-sm text-destructive">{error}</p>{/if}
				<Button type="submit" class="w-full" disabled={busy || !name.trim() || !email || password.length < 6}>
					{busy ? 'Creating…' : 'Create account'}
				</Button>
			</form>
			<p class="mt-4 text-center text-sm text-muted-foreground">
				Already have an account? <a href="/login" class="font-medium text-primary hover:underline">Log in</a>
			</p>
		</CardContent>
	</Card>
</div>
