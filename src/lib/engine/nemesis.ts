/**
 * Nemesis system: rival selection, head-to-head records, taunts, and smart recommendations.
 * Pure and deterministic engine for UPSC aspirants.
 */

export interface LeaderEntry {
	userId: string;
	name: string;
	avatar: string;
	accuracy: number; // 0..1 correct fraction
	reviews: number;  // total reviews counted
	streak?: number;
}

export interface H2HRecordResult {
	myRate: number;
	theirRate: number;
	outcome: 'win' | 'loss' | 'draw';
}

export interface TauntArgs {
	name: string;
	record: { win: number; loss: number; draw: number };
	wonDecks: number;
	lostDecks: number;
	userStreak: number;
	lastDeckTitle?: string;
}

export interface DeckDuelData {
	deckId: string;
	deckTitle: string;
	emoji: string;
	myCorrect: number;
	myTotal: number;
	theirCorrect: number;
	theirTotal: number;
}

export interface SubjectComparison {
	deckId: string;
	deckTitle: string;
	emoji: string;
	myAccuracy: number;
	theirAccuracy: number;
	gap: number; // myAccuracy - theirAccuracy
	status: 'dominant' | 'vulnerable' | 'behind' | 'even' | 'untested';
}

export interface NemesisRecommendation {
	targetSubject: SubjectComparison | null;
	attackSubject: SubjectComparison | null;
	defenseSubject: SubjectComparison | null;
	insights: string[];
	rivalCandidates: Array<LeaderEntry & { matchPercentage: number; statusLine: string }>;
}

/**
 * Pick the nemesis: the peer whose overall accuracy is closest to the user's.
 * Ties break toward more reviews, then lexicographic name (stable).
 */
export function selectNemesis(userId: string, entries: LeaderEntry[]): LeaderEntry | null {
	const me = entries.find((e) => e.userId === userId);
	if (!me) return null;
	let best: LeaderEntry | null = null;
	let bestDist = Infinity;
	for (const e of entries) {
		if (e.userId === userId) continue;
		const dist = Math.abs(e.accuracy - me.accuracy);
		const better =
			best === null ||
			dist < bestDist ||
			(dist === bestDist && e.reviews > best.reviews) ||
			(dist === bestDist && e.reviews === best.reviews && e.name < best.name);
		if (better) {
			best = e;
			bestDist = dist;
		}
	}
	return best;
}

/**
 * Head-to-head record between two users across deck stats.
 */
export function h2hRecord({
	myCorrect,
	myTotal,
	theirCorrect,
	theirTotal
}: {
	myCorrect: number;
	myTotal: number;
	theirCorrect: number;
	theirTotal: number;
}): H2HRecordResult {
	const myRate = myTotal === 0 ? 0 : myCorrect / myTotal;
	const theirRate = theirTotal === 0 ? 0 : theirCorrect / theirTotal;
	const outcome = myRate > theirRate ? 'win' : myRate < theirRate ? 'loss' : 'draw';
	return { myRate, theirRate, outcome };
}

/**
 * Deterministic taunt line for the dossier based on performance data.
 */
export function tauntFor({
	name,
	record,
	wonDecks,
	lostDecks,
	userStreak,
	lastDeckTitle
}: TauntArgs): string {
	if (userStreak >= 5) {
		return `${name} has seen you answer ${userStreak} in a row. They are taking notes.`;
	}
	if (record.loss > record.win) {
		return `Overall you lead ${name} ${record.win}–${record.loss}. Enjoy it while the syllabus lasts.`;
	}
	if (record.win > record.loss) {
		return `${name} leads you ${record.win}–${record.loss} overall. ${
			lastDeckTitle ? `${lastDeckTitle} is theirs — for now.` : 'The next deck decides.'
		}`;
	}
	if (wonDecks > lostDecks) {
		return `You split the decks with ${name} but took more of them. ${
			lostDecks > 0 ? `They will not forget ${lostDecks} loss${lostDecks === 1 ? '' : 'es'}.` : ''
		}`;
	}
	if (lostDecks > wonDecks) {
		return `Dead even overall, but ${name} holds more decks than you. Close the gap deck by deck.`;
	}
	return `You and ${name} are mirror images of each other. The next session decides who blinks.`;
}

/**
 * One-liner about a single card's duel, for the dossier ledger.
 */
export function cardDuelLine({
	front,
	myCorrect,
	myTotal,
	theirCorrect,
	theirTotal
}: {
	front: string;
	myCorrect: number;
	myTotal: number;
	theirCorrect: number;
	theirTotal: number;
}): string {
	const me = myTotal === 0 ? 0 : myCorrect / myTotal;
	const them = theirTotal === 0 ? 0 : theirCorrect / theirTotal;
	if (me > them) return `You own "${front}" — ${Math.round(me * 100)}% vs their ${Math.round(them * 100)}%.`;
	if (me < them) return `They own "${front}" — ${Math.round(them * 100)}% vs your ${Math.round(me * 100)}%.`;
	return `Even on "${front}" at ${Math.round(me * 100)}% — no edge.`;
}

/**
 * Generate smart recommendations based on Nemesis subject breakdown and leaderboard entries.
 */
export function getNemesisRecommendations({
	userId,
	nemesis,
	decks,
	allEntries
}: {
	userId: string;
	nemesis: LeaderEntry | null;
	decks: DeckDuelData[];
	allEntries: LeaderEntry[];
}): NemesisRecommendation {
	if (!nemesis) {
		return {
			targetSubject: null,
			attackSubject: null,
			defenseSubject: null,
			insights: ['Start completing MCQ quiz sessions to establish your rivalry baseline.'],
			rivalCandidates: []
		};
	}

	const subjectComparisons: SubjectComparison[] = decks.map((d) => {
		const myAcc = d.myTotal > 0 ? d.myCorrect / d.myTotal : 0;
		const theirAcc = d.theirTotal > 0 ? d.theirCorrect / d.theirTotal : 0;
		const gap = myAcc - theirAcc;

		let status: SubjectComparison['status'] = 'even';
		if (d.myTotal === 0 && d.theirTotal === 0) status = 'untested';
		else if (gap > 0.15) status = 'dominant';
		else if (gap < -0.15) status = 'behind';
		else if (theirAcc < 0.5 && d.theirTotal > 0) status = 'vulnerable';

		return {
			deckId: d.deckId,
			deckTitle: d.deckTitle,
			emoji: d.emoji,
			myAccuracy: myAcc,
			theirAccuracy: theirAcc,
			gap,
			status
		};
	});

	// Find target subject (where nemesis leads or gap is closest)
	const behindSubjects = subjectComparisons
		.filter((s) => s.status === 'behind' || s.gap < 0)
		.sort((a, b) => a.gap - b.gap); // largest gap behind first

	const targetSubject = behindSubjects[0] ?? subjectComparisons[0] ?? null;

	// Find vulnerability attack subject (where nemesis accuracy is lowest)
	const attackSubject = [...subjectComparisons]
		.filter((s) => s.theirAccuracy > 0)
		.sort((a, b) => a.theirAccuracy - b.theirAccuracy)[0] ?? null;

	// Find defense subject (where nemesis accuracy is highest)
	const defenseSubject = [...subjectComparisons]
		.filter((s) => s.theirAccuracy > 0)
		.sort((a, b) => b.theirAccuracy - a.theirAccuracy)[0] ?? null;

	const insights: string[] = [];

	if (targetSubject && targetSubject.gap < 0) {
		insights.push(
			`🎯 Priority Target: ${targetSubject.emoji} ${targetSubject.deckTitle} — ${nemesis.name} leads by ${Math.round(Math.abs(targetSubject.gap) * 100)}%. Practice this topic to close the gap!`
		);
	}

	if (attackSubject) {
		insights.push(
			`⚡ Rival Vulnerability: ${attackSubject.emoji} ${attackSubject.deckTitle} — ${nemesis.name} only scores ${Math.round(attackSubject.theirAccuracy * 100)}% here. Exploit this subject to gain lead points!`
		);
	}

	if (defenseSubject && defenseSubject.theirAccuracy >= 0.7) {
		insights.push(
			`🛡️ Threat Defense: ${defenseSubject.emoji} ${defenseSubject.deckTitle} — ${nemesis.name} is strong here (${Math.round(defenseSubject.theirAccuracy * 100)}%). Master key questions to prevent losing ground.`
		);
	}

	if (insights.length === 0) {
		insights.push(`🔥 Even Matchup: You and ${nemesis.name} are closely matched across all active subjects.`);
	}

	// Calculate rival candidates
	const me = allEntries.find((e) => e.userId === userId);
	const meAcc = me ? me.accuracy : 0;

	const rivalCandidates = allEntries
		.filter((e) => e.userId !== userId)
		.map((e) => {
			const diff = Math.abs(e.accuracy - meAcc);
			const matchPercentage = Math.max(50, Math.round((1 - diff) * 100));
			let statusLine = 'Balanced Rival';
			if (e.accuracy > meAcc + 0.1) statusLine = 'Pacesetter (Harder Challenge)';
			else if (e.accuracy < meAcc - 0.1) statusLine = 'Catchable Target';

			return {
				...e,
				matchPercentage,
				statusLine
			};
		})
		.sort((a, b) => b.matchPercentage - a.matchPercentage)
		.slice(0, 4);

	return {
		targetSubject,
		attackSubject,
		defenseSubject,
		insights,
		rivalCandidates
	};
}
