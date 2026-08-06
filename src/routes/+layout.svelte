<script>
	import '../app.css';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { FolderTree, Sparkles, GraduationCap, Users, Trophy, LogOut, Settings, BookOpenCheck } from 'lucide-svelte';
	import { Toaster } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { data, children } = $props();

	async function logout() {
		await fetch('/api/logout', { method: 'POST' });
		await invalidateAll();
	}

	const links = [
		{ href: '/', label: 'Syllabus Index', icon: FolderTree },
		{ href: '/decks', label: 'Flashcards & Quiz', icon: Sparkles },
		{ href: '/study', label: 'Subject Drills', icon: GraduationCap },
		{ href: '/colab', label: 'Colab & Rivalry', icon: Users },
		{ href: '/leaderboard', label: 'Leaderboard', icon: Trophy }
	];

	const active = (href) =>
		page.url.pathname === href || (href !== '/' && page.url.pathname.startsWith(href));
	const isAuthPage = $derived(page.url.pathname === '/login' || page.url.pathname === '/register');
</script>

{#if !data.user && !isAuthPage}
	<div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
		<Card class="w-full max-w-sm border-t-2 border-t-primary shadow-xl">
			<CardHeader class="text-center">
				<p class="eyebrow text-primary">The Makkhali Project</p>
				<CardTitle class="font-display text-3xl font-semibold tracking-tight">Your answer sheet.</CardTitle>
				<CardDescription>UPSC Prelims MCQ quizzes with spaced repetition, subject trees, and a nemesis system. Log in or create an account — your progress is saved.</CardDescription>
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
	<header class="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-xl shadow-xs">
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
			<!-- Brand Logo -->
			<a href="/" class="flex items-center gap-2.5 group">
				<div class="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-orange-500 text-primary-foreground shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
					<BookOpenCheck class="size-5" />
				</div>
				<div class="flex flex-col">
					<span class="font-display text-base font-bold italic tracking-tight leading-none text-foreground">
						Makkhali <span class="text-xs font-mono font-bold not-italic text-primary">PRELIMS</span>
					</span>
					<span class="text-[10px] text-muted-foreground font-mono">UPSC Flashcards</span>
				</div>
			</a>

			<!-- Desktop Segmented Capsule Navigation -->
			<nav class="hidden md:flex items-center gap-1 rounded-full bg-muted/60 p-1 border border-border/50 shadow-inner">
				{#each links as link}
					{@const isActive = active(link.href)}
					<a
						href={link.href}
						class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 {isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}"
					>
						<link.icon class="size-3.5" />
						<span>{link.label}</span>
					</a>
				{/each}
			</nav>

			<!-- Right Actions -->
			<div class="flex items-center gap-2 text-sm">
				<div class="hidden sm:flex items-center gap-2 rounded-full border border-border/50 bg-card px-3 py-1 text-xs">
					<span class="size-2 rounded-full bg-green-500 animate-pulse"></span>
					<span class="font-semibold text-foreground truncate max-w-[100px]">{data.user.name}</span>
				</div>

				<a href="/settings" class="inline-flex items-center rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Settings" aria-label="Settings">
					<Settings class="size-4" />
				</a>

				<button onclick={logout} class="inline-flex items-center rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors" title="Log out" aria-label="Log out">
					<LogOut class="size-4" />
				</button>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 pb-24 md:pb-8">{@render children()}</main>
	<Toaster position="top-center" richColors />

	<!-- Floating Mobile Glassmorphic Navigation -->
	<nav class="fixed bottom-4 left-4 right-4 z-50 md:hidden rounded-2xl border border-border/80 bg-background/90 backdrop-blur-xl shadow-2xl p-1.5">
		<div class="flex items-center justify-around">
			{#each links as link}
				{@const isActive = active(link.href)}
				<a
					href={link.href}
					class="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-all {isActive ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
				>
					<link.icon class="size-4" />
					<span class="text-[10px] font-semibold">{link.label}</span>
				</a>
			{/each}
		</div>
	</nav>

	<footer class="hidden border-t md:block mt-12">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-muted-foreground">
			<span class="font-display font-semibold">The Makkhali Project</span>
			<span class="font-mono text-[11px]">UPSC Prelims Syllabus Index & MCQ Flashcards</span>
		</div>
	</footer>
{/if}
