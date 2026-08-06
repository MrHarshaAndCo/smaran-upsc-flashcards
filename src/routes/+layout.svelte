<script>
	import '../app.css';
	import { page } from '$app/state';
	import NameForm from '$lib/components/NameForm.svelte';

	let { data, children } = $props();

	const links = [
		{ href: '/quiz', label: 'Quiz' },
		{ href: '/decks', label: 'Study' },
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/leaderboard', label: 'Leaderboard' },
		{ href: '/nemesis', label: 'Rival' }
	];

	const isActive = (href) => page.url.pathname === href || (href !== '/' && page.url.pathname.startsWith(href));

	$effect(() => {
		if (!import.meta.env.SSR && import.meta.env.PROD && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => {});
		}
	});
</script>

<nav class="nav">
	<div class="nav-inner">
		<a class="wordmark" href="/">
			Smaran<span class="dot">.</span><small>UPSC Flashcards</small>
		</a>
		<div class="nav-links">
			{#each links as link (link.href)}
				<a class="nav-link" class:active={isActive(link.href)} href={link.href}>{link.label}</a>
			{/each}
		</div>
		{#if data.user}
			<div class="user-chip" title="Signed in as {data.user.name}">
				<span class="avatar">{data.user.avatar}</span>
				<span>{data.user.name}</span>
			</div>
		{:else}
			<NameForm compact />
		{/if}
	</div>
</nav>

<main>
	{@render children()}
</main>

<footer class="footer">
	<div class="footer-inner">
		<span>Smaran — spaced repetition for the civil services exam.</span>
		<span>Miss a card, and your rival notices.</span>
	</div>
</footer>
