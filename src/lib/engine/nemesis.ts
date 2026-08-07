/**
 * Nemesis system: the rival selection, head-to-head records, taunts, and recommendations.
 * Pure and deterministic — every line of taunt copy is a function of the
 * numbers, never of randomness.
 */

export interface LeaderEntry {
	userId: string;
	name: string;
	avatar?: string;
	accuracy: number;
	reviews: number;
	streak?: number;
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

export interface NemesisRecommendation {
	rivalCandidates: Array<{
		userId: string;
		name: string;
		avatar: string;
		accuracy: number;
		matchPercentage: number;
		statusLine: string;
	}>;
	recommendedFocusDeck: {
		deckId: string;
		deckTitle: string;
		reason: string;
	} | null;
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
}): { myRate: number; theirRate: number; outcome: 'win' | 'loss' | 'draw' } {
	const myRate = myTotal === 0 ? 0 : myCorrect / myTotal;
	const theirRate = theirTotal === 0 ? 0 : theirCorrect / theirTotal;
	const outcome = myRate > theirRate ? 'win' : myRate < theirRate ? 'loss' : 'draw';
	return { myRate, theirRate, outcome };
}

/**
 * Deterministic taunt line for the dossier.
 */
export function tauntFor({
	name,
	record,
	wonDecks,
	lostDecks,
	userStreak,
	lastDeckTitle
}: {
	name: string;
	record: { win: number; loss: number; draw: number };
	wonDecks: number;
	lostDecks: number;
	userStreak: number;
	lastDeckTitle?: string;
}): string {
	if (userStreak >= 5) {
		return `${name} has seen you answer ${userStreak} in a row. They are taking notes.`;
	}
	if (record.loss > record.win) {
		return `Overall you lead ${name} ${record.win}–${record.loss}. Enjoy it while the syllabus lasts.`;
	}
	if (record.win > record.loss) {
		return `${name} leads you ${record.win}–${record.loss} overall. ${lastDeckTitle ? `${lastDeckTitle} is theirs — for now.` : 'The next deck decides.'}`;
	}
	if (wonDecks > lostDecks) {
		return `You split the decks with ${name} but took more of them. ${lostDecks > 0 ? `They will not forget ${lostDecks} loss${lostDecks === 1 ? '' : 'es'}.` : ''}`;
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
 * Generates recommendations for rival candidates and focus deck.
 */
export function getNemesisRecommendations(
	userId: string,
	entries: LeaderEntry[],
	decks: DeckDuelData[] = []
): NemesisRecommendation {
	const me = entries.find((e) => e.userId === userId) || {
		userId,
		name: 'You',
		accuracy: 0.75,
		reviews: 10
	};

	const candidates = entries
		.filter((e) => e.userId !== userId)
		.map((e) => {
			const diff = Math.abs(e.accuracy - me.accuracy);
			const matchPercentage = Math.max(60, Math.round(100 - diff * 200));
			let statusLine = 'Target Rival';
			if (e.accuracy > me.accuracy) statusLine = 'Leading Aspirant (Pace Rival)';
			else if (e.accuracy < me.accuracy) statusLine = 'Chasing Aspirant (Challenger)';
			else statusLine = 'Dead Even Match';

			return {
				userId: e.userId,
				name: e.name,
				avatar: e.avatar || '🎯',
				accuracy: e.accuracy,
				matchPercentage,
				statusLine
			};
		})
		.sort((a, b) => b.matchPercentage - a.matchPercentage)
		.slice(0, 4);

	let recommendedFocusDeck: NemesisRecommendation['recommendedFocusDeck'] = null;
	if (decks.length > 0) {
		const losingDeck = decks.find(
			(d) => d.theirTotal > 0 && d.theirCorrect / d.theirTotal > (d.myTotal > 0 ? d.myCorrect / d.myTotal : 0)
		);
		if (losingDeck) {
			recommendedFocusDeck = {
				deckId: losingDeck.deckId,
				deckTitle: losingDeck.deckTitle,
				reason: `Your rival currently leads in ${losingDeck.deckTitle}. Review this deck to flip the score!`
			};
		} else {
			recommendedFocusDeck = {
				deckId: decks[0].deckId,
				deckTitle: decks[0].deckTitle,
				reason: `Keep expanding your lead in ${decks[0].deckTitle}!`
			};
		}
	}

	return {
		rivalCandidates: candidates,
		recommendedFocusDeck
	};
}
