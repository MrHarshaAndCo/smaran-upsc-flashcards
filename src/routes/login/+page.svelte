<script>
	import { LogIn } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

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
			const r = await fetch('/api/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const j = await r.json().catch(() => ({}));
			if (!r.ok) throw new Error(j.error ?? 'Login failed.');
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
				<LogIn class="size-5 text-primary" /> Log in
			</CardTitle>
			<CardDescription>Welcome back — your nemesis missed you.</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={submit} class="flex flex-col gap-3">
				<div class="flex flex-col gap-1.5">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="you@example.com" bind:value={email} autocomplete="email" />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="password">Password</Label>
					<Input id="password" type="password" placeholder="Your password" bind:value={password} autocomplete="current-password" />
				</div>
				{#if error}<p class="text-sm text-destructive">{error}</p>{/if}
				<Button type="submit" class="w-full" disabled={busy || !email || !password}>
					{busy ? 'Logging in…' : 'Log in'}
				</Button>
			</form>
			<p class="mt-4 text-center text-sm text-muted-foreground">
				New here? <a href="/register" class="font-medium text-primary hover:underline">Create an account</a>
			</p>
		</CardContent>
	</Card>
</div>
