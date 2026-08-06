<script>
	import '../app.css';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { PenLine, BookOpen, Users, Trophy, LogOut, Settings } from 'lucide-svelte';
	import { Toaster } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { data, children } = $props();

	async function logout() {
		await fetch('/api/logout', { method: 'POST' });
		await invalidateAll();
	}

	const links = [
		{ href: '/quiz', label: 'Quiz', icon: PenLine },
		{ href: '/decks', label: 'Flashcard', icon: BookOpen },
		{ href: '/colab', label: 'Colab', icon: Users },
		{ href: '/leaderboard', label: 'Board', icon: Trophy }
	];

	const active = (href) =>
		page.url.pathname === href || (href !== '/' && page.url.pathname.startsWith(href));
	const isAuthPage = $derived(page.url.pathname === '/login' || page.url.pathname === '/register');
</script>

{#if !data.user && !isAuthPage}
	<div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
		<Card class="w-full max-w-sm border-t-2 border-t-primary">
			<CardHeader class="text-center">
				<p class="eyebrow text-primary">The Makkhali Project</p>
				<CardTitle class="font-display text-3xl font-semibold tracking-tight">Your answer sheet.</CardTitle>
				<CardDescription>UPSC flashcards with spaced repetition, quizzes and a nemesis system. Log in or create an account — your progress is saved.</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-2">
				<a href="/login" class="w-full"><Button class="w-full" size="lg">Log in</Button></a>
				<a href="/register" class="w-full"><Button variant="outline" size="lg" class="w-full">Create an account</Button></a>
			</CardContent>
		</Card>
	</div>
{:else if !data.user}
	<!-- Auth pages (login/register) — standalone, no app shell -->
	<main class="min-h-screen">{@render children()}</main>
{:else}
	<header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
		<div class="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
			<a href="/" class="flex items-baseline gap-2">
				<span class="font-display text-xl font-bold tracking-tight">Makkhali</span>
				<span class="eyebrow hidden text-muted-foreground sm:inline">UPSC</span>
			</a>
			<nav class="hidden items-center gap-1 md:flex ml-2">
				{#each links as link}
					<a href={link.href} class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {active(link.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}">
						<link.icon class="size-4" /> {link.label}
					</a>
				{/each}
			</nav>
			<div class="flex-1" />
			<div class="flex items-center gap-1 text-sm">
				<span class="hidden max-w-28 truncate font-medium sm:inline">{data.user.name}</span>
				<a href="/settings" class="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Settings" aria-label="Settings"><Settings class="size-4" /></a>
				<button onclick={logout} class="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Log out" aria-label="Log out"><LogOut class="size-4" /></button>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 pb-24 md:pb-8">{@render children()}</main>
	<Toaster position="top-center" richColors />

	<nav class="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
		<div class="mx-auto flex h-16 max-w-5xl items-center justify-around px-2">
			{#each links as link}
				<a href={link.href} class="flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium {active(link.href) ? 'text-primary' : 'text-muted-foreground'}">
					<link.icon class="size-5" /> <span>{link.label}</span>
				</a>
			{/each}
		</div>
	</nav>

	<footer class="hidden border-t md:block mt-12">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-xs text-muted-foreground">
			<span class="font-display font-semibold">The Makkhali Project</span>
			<span class="font-mono">Miss a card, and your rival notices.</span>
		</div>
	</footer>
{/if}
