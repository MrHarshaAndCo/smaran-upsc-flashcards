<script>
	import DeckCard from '$lib/components/DeckCard.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import NemesisDossier from '$lib/components/NemesisDossier.svelte';
	import Stat from '$lib/components/Stat.svelte';

	let { data } = $props();
</script>

<section class="hero">
	<div class="wrap">
		<div class="hero-grid">
			<div>
				<p class="eyebrow">Smaran · स्मरण — memory that compounds</p>
				<h1>
					Remember more of<br />
					what you <span class="accent">read</span>.
				</h1>
				<p class="lede">
					UPSC flashcards with spaced repetition that schedules reviews exactly when memory
					needs them — plus a scoreboard of your peers, a rival who remembers every card you
					missed, and feedback after every answer.
				</p>
				<div class="hero-cta">
					<a class="btn btn-primary" href="/decks">Start studying</a>
					<a class="btn btn-ghost" href="/leaderboard">See the board</a>
				</div>
				{#if data.user && data.nemesis}
					<p class="small muted" style="margin-top:18px">
						Your rival is {data.nemesis.avatar} {data.nemesis.name} at {Math.round(data.nemesis.accuracy * 100)}%.
						Beat them deck by deck.
					</p>
				{/if}
			</div>
			<div class="hero-stats">
				<Stat label="Cards" value={data.totalCards} tone="saffron-deep" />
				<Stat label="Decks" value={data.decks.length} sub="Polity · History · Geography · Culture · Economy" />
				<Stat label="Students on the board" value={data.peerCount} />
				{#if data.summary}
					<Stat label="Your accuracy" value={`${Math.round((data.summary.correct / Math.max(data.summary.total, 1)) * 100)}%`} sub={`${data.summary.total} reviews · 🔥 ${data.summary.streak} streak`} />
				{/if}
			</div>
		</div>
	</div>
</section>

<div class="wrap">
	<section class="section">
		<div class="section-head">
			<h2>Choose your battlefield</h2>
			<a class="small" href="/decks">All decks →</a>
		</div>
		<div class="deck-grid">
			{#each data.decks.slice(0, 4) as deck (deck.id)}
				<DeckCard {deck} />
			{/each}
		</div>
	</section>

	<section class="section">
		<div class="section-head">
			<h2>How Smaran works</h2>
		</div>
		<div class="kbd-grid">
			<div class="step">
				<span class="num">1</span>
				<div>
					<h3>Study</h3>
					<p class="small muted">
						Flip flashcards and rate each answer — again, hard, good, easy. Missed cards come
						back before the session ends.
					</p>
				</div>
			</div>
			<div class="step">
				<span class="num">2</span>
				<div>
					<h3>Get told the truth</h3>
					<p class="small muted">
						After every answer: how your memory is doing, what your peers scored on the same
						card, and whether your rival beat you to it.
					</p>
				</div>
			</div>
			<div class="step">
				<span class="num">3</span>
				<div>
					<h3>Out-study your rival</h3>
					<p class="small muted">
						The scheduler plans your next review for the moment memory would fade. The
						leaderboard and nemesis dossier keep score.
					</p>
				</div>
			</div>
		</div>
	</section>

	{#if data.user && data.nemesis}
		<section class="section">
			<div class="section-head">
				<h2>Your rivalry</h2>
				<a class="small" href="/nemesis">Full dossier →</a>
			</div>
			<NemesisDossier nemesis={data.nemesis} record={{ win: 0, loss: 0, draw: 0 }} taunt="Start a session to open the ledger." compact />
		</section>
	{/if}

	<section class="section">
		<div class="section-head">
			<h2>Leaderboard</h2>
			<a class="small" href="/leaderboard">Full board →</a>
		</div>
		<Leaderboard entries={data.leaderboard} highlight={data.userId} />
	</section>
</div>
