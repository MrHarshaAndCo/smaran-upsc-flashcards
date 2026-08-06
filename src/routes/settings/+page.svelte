<script>
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Mail, User as UserIcon, KeyRound, ChevronLeft } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data } = $props();

	let name = $state(data.user.name);
	let savingName = $state(false);

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let savingPassword = $state(false);
	let pwError = $state('');

	async function saveName(e) {
		e.preventDefault();
		if (savingName || !name.trim()) return;
		savingName = true;
		try {
			const r = await fetch('/api/settings/profile', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name })
			});
			if (!r.ok) throw new Error('could not save name');
			await invalidateAll();
			toast.success('Name updated');
		} catch {
			toast.error('Could not save name');
		}
		savingName = false;
	}

	async function changePassword(e) {
		e.preventDefault();
		if (savingPassword) return;
		if (newPassword.length < 6) {
			pwError = 'New password must be at least 6 characters.';
			return;
		}
		if (newPassword !== confirmPassword) {
			pwError = 'New passwords do not match.';
			return;
		}
		savingPassword = true;
		pwError = '';
		try {
			const r = await fetch('/api/settings/password', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword })
			});
			const j = await r.json().catch(() => ({}));
			if (!r.ok) throw new Error(j.error ?? 'could not change password');
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			toast.success('Password changed');
		} catch (err) {
			pwError = err.message;
		}
		savingPassword = false;
	}
</script>

<div class="mx-auto max-w-lg space-y-8 pt-8">
	<div>
		<a href="/" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft class="size-4" /> Back</a>
		<h1 class="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
		<p class="mt-1 text-muted-foreground">Your account details and security.</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2"><UserIcon class="size-4 text-primary" /> Profile</CardTitle>
			<CardDescription>Your display name and the email on this account.</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex flex-col gap-1.5">
				<Label>Email</Label>
				<div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
					<Mail class="size-4 text-muted-foreground" />
					<span class="font-medium">{data.user.email ?? 'No email on this account'}</span>
				</div>
			</div>
			<form onsubmit={saveName} class="flex flex-col gap-1.5">
				<Label for="name">Name</Label>
				<div class="flex gap-2">
					<Input id="name" bind:value={name} maxlength="24" class="flex-1" />
					<Button type="submit" disabled={savingName || !name.trim() || name === data.user.name}>{savingName ? '…' : 'Save'}</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2"><KeyRound class="size-4 text-primary" /> Change password</CardTitle>
			<CardDescription>Set a new password for this account.</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={changePassword} class="space-y-4">
				<div class="flex flex-col gap-1.5">
					<Label for="current">Current password</Label>
					<Input id="current" type="password" bind:value={currentPassword} autocomplete="current-password" />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="new">New password</Label>
					<Input id="new" type="password" bind:value={newPassword} autocomplete="new-password" placeholder="At least 6 characters" />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="confirm">Confirm new password</Label>
					<Input id="confirm" type="password" bind:value={confirmPassword} autocomplete="new-password" />
				</div>
				{#if pwError}<p class="text-sm text-destructive">{pwError}</p>{/if}
				<Button type="submit" disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} class="w-full">
					{savingPassword ? 'Changing…' : 'Change password'}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
