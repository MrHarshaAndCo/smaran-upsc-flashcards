<script>
	import { goto } from '$app/navigation';
	import NameForm from '$lib/components/NameForm.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import { peerFeedback } from '$lib/engine/feedback.js';
	import { h2hRecord } from '$lib/engine/nemesis.js';

	let { data } = $props();

	const questions = data.quiz.questions;
	let idx = $state(0);
	let selected = $state(null); // number | null
	let answered = $state(false);
	let correctNow = $state(false);
	let feedback = $state(null); // {tone, title, body}
	let results = $state([]); // {questionId, chosen, correct, ms}
	let done = $state(false);
	let posting = $state(false);
	let summary = $state(null);
	let cardShownAt = Date.now();
	const startedAt = Date.now();

	const current = $derived(questions[idx]);
	const letters = ['A', 'B', 'C', 'D'];

	function choose(i) {
		if (answered) return;
		selected = i;
	}

	function check() {
		if (selected === null || answered) return;
		const q = current;
		const correct = selected === q.correctIndex;
		correctNow = correct;
		results.push({ questionId: q.id, chosen: selected, correct, ms: Date.now() - cardShownAt });

		const items = [];
		items.push({
			tone: correct ? 'good' : 'bad',
			title: correct ? 'Correct' : 'Not quite',
			body: q.explanation
		});
		const peer = peerFeedback({
			correct,
			peers: data.peerStats?.[q.id] ?? null,
			nemesis: data.nemesisStats?.[q.id] ?? null
		});
		if (peer) items.push(peer);
		feedback = items;
		answered = true;
		cardShownAt = Date.now();
	}

	function next() {
		if (idx + 1 < questions.length) {
			idx++;
			selected = null;
			answered = false;
			feedback = null;
			cardShownAt = Date.now();
		} else {
			finish();
		}
	}

	async function finish() {
		done = true;
		const correct = results.filter((r) => r.correct).length;
		const total = results.length;

		let rivalNote = null;
		if (data.nemesisStats && data.nemesisName) {
			let nc = 0;
			let nt = 0;
			for (const s of Object.values(data.nemesisStats)) {
				nc += s.correctCount;
				nt += s.totalCount;
			}
			const r = h2hRecord({ myCorrect: correct, myTotal: total, theirCorrect: nc, theirTotal: nt });
			rivalNote =
				r.outcome === 'win'
					? `You beat ${data.nemesisName} on this quiz — ${Math.round(r.myRate * 100)}% vs their ${Math.round(r.theirRate * 100)}%.`
					: r.outcome === 'loss'
						? `${data.nemesisName} scored better on this quiz — their ${Math.round(r.theirRate * 100)}% beats your ${Math.round(r.myRate * 100)}%. Rematch.`
						: `Dead even with ${data.nemesisName} on this quiz. The next one decides.`;
		}

		const rate = total === 0 ? 0 : correct / total;
		const advice =
			rate >= 0.9
				? { tone: 'good', title: 'Examination form', body: `${Math.round(rate * 100)}% — that is a serious score. The misses below are the only things worth your time.` }
				: rate >= 0.6
					? { tone: 'neutral', title: 'Solid, with seams', body: `${Math.round(rate * 100)}% correct. Review the questions you missed below — those are your real syllabus.` }
					: { tone: 'bad', title: 'Rough pass', body: `${Math.round(rate * 100)}% — below your standard. Go through every missed question below, then take the quiz again tomorrow.` };

		summary = { correct, total, advice, rivalNote };

		if (data.userId) {
			posting = true;
			try {
				await fetch('/api/quiz', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ quizId: data.quiz.id, startedAt, endedAt: Date.now(), results })
				});
			} catch {
				// Best-effort; the on-screen result still stands.
			}
			posting = false;
		}
	}

	function restart() {
		idx = 0;
		selected = null;
		answered = false;
		feedback = null;
		results = [];
		done = false;
		summary = null;
		cardShownAt = Date.now();
	}

	function optionVariant(i) {
		if (!answered) return selected === i ? 'secondary' : 'outline';
		if (i === current.correctIndex) return 'success';
		if (i === selected) return 'destructive';
		return 'outline';
	}

	$effect(() => {
		function onKey(e) {
			if (done || !data.user) return;
			const n = parseInt(e.key, 10);
			if (!answered && n >= 1 && n <= questions.length) {
				selected = n - 1;
			} else if (!answered && selected !== null && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				check();
			} else if (answered && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				next();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div class="wrap" style="padding-top: 32px; max-width: 680px">
	{#if !data.user}
		<div class="gate">
			<p class="eyebrow">{data.quiz.emoji} {data.quiz.title}</p>
			<h1>Enter your name to take the quiz</h1>
			<p class="muted">Your score is compared against the room and your rival. No password — just a name.</p>
			<div style="margin-top: 20px; display: flex; justify-content: center">
				<NameForm />
			</div>
		</div>
	{:else if done}
		<div class="card" style="padding: 30px">
			<p class="eyebrow">{data.quiz.emoji} {data.quiz.title} · report</p>
			<h1 style="font-size: 2.6rem">
				{Math.round((summary.correct / Math.max(summary.total, 1)) * 100)}%
				<span class="muted" style="font-size: 1.2rem; font-weight: 600"> — {summary.correct}/{summary.total} correct</span>
			</h1>
			<div class="feedback {summary.advice.tone}" style="margin-top: 16px">
				<div class="fb-title">{summary.advice.title}</div>
				<div class="fb-body">{summary.advice.body}</div>
			</div>
			{#if summary.rivalNote}
				<div class="feedback neutral" style="margin-top: 10px">
					<div class="fb-title">Rival report</div>
					<div class="fb-body">{summary.rivalNote}</div>
				</div>
			{/if}

			<hr class="hr" />
			<h3 style="margin-bottom: 10px">Question by question</h3>
			<div class="stack">
				{#each questions as q, i (q.id)}
					{@const r = results[i]}
					{#if r}
						<div class="duel-row" style="align-items: flex-start">
							<span class="duel-mark {r.correct ? 'win' : 'loss'}">{r.correct ? '✓' : '✗'}</span>
							<div style="flex: 1">
								<div class="small" style="font-weight: 600">{i + 1}. {q.question}</div>
								<div class="small muted" style="margin-top: 4px">
									Your answer: <strong>{letters[r.chosen]}. {q.options[r.chosen]}</strong>
									{#if !r.correct}
										· correct: <strong style="color: var(--laurel)">{letters[q.correctIndex]}. {q.options[q.correctIndex]}</strong>
									{/if}
								</div>
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<div style="display: flex; gap: 10px; margin-top: 22px; flex-wrap: wrap">
				<Button onclick={restart} disabled={posting}>Retake quiz</Button>
				<Button variant="outline" onclick={() => goto('/quiz')} disabled={posting}>All quizzes</Button>
				<Button variant="ghost" onclick={() => goto('/dashboard')} disabled={posting}>Dashboard</Button>
			</div>
			{#if posting}<p class="small muted" style="margin-top: 10px">Recording quiz…</p>{/if}
		</div>
	{:else}
		<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px">
			<p class="eyebrow">{data.quiz.emoji} {data.quiz.title} · {data.user.name}</p>
			<p class="mono" style="color: var(--slate)">Q {idx + 1} / {questions.length}</p>
		</div>
		<Progress value={idx} max={questions.length} style="margin-bottom: 18px" />

		<Card>
			<CardHeader>
				<CardTitle style="font-size: 1.25rem; line-height: 1.35">{current.question}</CardTitle>
			</CardHeader>
			<CardContent class="flex flex-col gap-2.5">
				{#each current.options as option, i (i)}
					<Button
						variant={optionVariant(i)}
						size="lg"
						class="w-full justify-start text-left h-auto py-3.5 px-4"
						disabled={answered}
						onclick={() => choose(i)}
					>
						<span class="font-[var(--font-mono)] mr-2 opacity-70">{letters[i]}</span>
						<span style="white-space: normal">{option}</span>
					</Button>
				{/each}
			</CardContent>
		</Card>

		{#if answered}
			<div class="stack" style="margin-top: 16px">
				{#each feedback as f (f.title)}
					<div class="feedback {f.tone}">
						<div class="fb-title">{f.title}</div>
						<div class="fb-body">{f.body}</div>
					</div>
				{/each}
				<Button class="w-full" size="lg" onclick={next}>
					{idx + 1 < questions.length ? 'Next question' : 'See results'}
				</Button>
			</div>
		{:else}
			<div style="margin-top: 16px; display: flex; gap: 10px">
				<Button class="flex-1" size="lg" disabled={selected === null} onclick={check}>
					Check answer
				</Button>
			</div>
			<p class="small muted" style="margin-top: 10px; text-align: center">Pick with 1–4, then press Enter</p>
		{/if}
	{/if}
</div>
