<script>
	import '../app.css';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { PenLine, BookOpen, LayoutDashboard, Trophy, Swords } from 'lucide-svelte';
	import { Toaster } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { data, children } = $props();

	let name = $state('');
	let busy = $state(false);
	let error = $state('');

	async function signIn(e) {
		e.preventDefault();
		const n = name.trim();
		if (!n || busy) return;
		busy = true;
		error = '';
		try {
			const r = await fetch('/api/user', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: n })
			});
			if (!r.ok) throw new Error();
			await invalidateAll();
		} catch {
			error = 'Something went wrong. Try again.';
		}
		busy = false;
	}

	const links = [
		{ href: '/quiz', label: 'Quiz', icon: PenLine },
		{ href: '/decks', label: 'Study', icon: BookOpen },
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/leaderboard', label: 'Board', icon: Trophy },
		{ href: '/nemesis', label: 'Rival', icon: Swords }
	];

	const active = (href) =>
		page.url.pathname === href || (href !== '/' && page.url.pathname.startsWith(href));
</script>

{#if !data.user}
	<!-- Auth gate — mandatory, full screen -->
	<Toaster position="top-center" richColors />
	<div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
		<Card class="w-full max-w-sm">
			<CardHeader class="text-center">
				<CardTitle class="text-2xl">The Makkhali Project</CardTitle>
				<CardDescription>UPSC flashcards with spaced repetition. Enter your name to start — no password needed.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onsubmit={signIn} class="flex flex-col gap-3">
					<Input
						placeholder="Your name"
						bind:value={name}
						maxlength="24"
						autocomplete="name"
						class="text-center"
					/>
					<Button type="submit" disabled={busy || !name.trim()} class="w-full">
						{busy ? 'Signing in…' : 'Start studying'}
					</Button>
					{#if error}
						<p class="text-sm text-destructive text-center">{error}</p>
					{/if}
				</form>
			</CardContent>
		</Card>
	</div>
{:else}
	<!-- Desktop top nav -->
	<header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
		<div class="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
			<a href="/" class="flex items-center gap-2 font-bold text-lg">
				<span class="text-primary">Makkhali</span>
				<span class="hidden sm:inline text-xs text-muted-foreground font-normal">UPSC</span>
			</a>
			<nav class="hidden md:flex items-center gap-1 ml-2">
				{#each links as link}
					<a href={link.href} class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {active(link.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}">
						<link.icon class="size-4" />
						{link.label}
					</a>
				{/each}
			</nav>
			<div class="flex-1" />
			<div class="flex items-center gap-2 text-sm">
				<span class="font-medium">{data.user.name}</span>
				<span>{data.user.avatar}</span>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 pb-24 md:pb-8">
		{@render children()}
	</main>

	<Toaster position="top-center" richColors />

	<!-- Mobile bottom nav -->
	<nav class="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
		<div class="mx-auto flex h-16 max-w-5xl items-center justify-around px-2">
			{#each links as link}
				<a href={link.href} class="flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium {active(link.href) ? 'text-primary' : 'text-muted-foreground'}">
					<link.icon class="size-5" />
					<span>{link.label}</span>
				</a>
			{/each}
		</div>
	</nav>

	<footer class="hidden md:block border-t mt-12">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-xs text-muted-foreground">
			<span>The Makkhali Project</span>
			<span>Miss a card, and your rival notices.</span>
		</div>
	</footer>
{/if}
