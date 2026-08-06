/**
 * Nemesis system: the rival selection, head-to-head records, and taunts.
 * Pure and deterministic — every line of taunt copy is a function of the
 * numbers, never of randomness.
 */

/**
 * @typedef {object} LeaderEntry
 * @property {string} userId
 * @property {string} name
 * @property {number} accuracy     0..1 correct fraction
 * @property {number} reviews      total reviews counted
 */

/**
 * Pick the nemesis: the peer whose overall accuracy is closest to the user's.
 * Ties break toward more reviews, then lexicographic name (stable).
 *
 * @param {string} userId
 * @param {LeaderEntry[]} entries
 * @returns {LeaderEntry|null}
 */
export function selectNemesis(userId, entries) {
	const me = entries.find((e) => e.userId === userId);
	if (!me) return null;
	let best = null;
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
 *
 * @param {object} args
 * @param {number} args.myCorrect
 * @param {number} args.myTotal
 * @param {number} args.theirCorrect
 * @param {number} args.theirTotal
 * @returns {{ myRate: number, theirRate: number, outcome: 'win'|'loss'|'draw' }}
 */
export function h2hRecord({ myCorrect, myTotal, theirCorrect, theirTotal }) {
	const myRate = myTotal === 0 ? 0 : myCorrect / myTotal;
	const theirRate = theirTotal === 0 ? 0 : theirCorrect / theirTotal;
	const outcome = myRate > theirRate ? 'win' : myRate < theirRate ? 'loss' : 'draw';
	return { myRate, theirRate, outcome };
}

/**
 * Deterministic taunt line for the dossier. Every branch is keyed on real
 * numbers so the rivalry always has something true to say.
 *
 * @param {object} args
 * @param {string} args.name            nemesis name
 * @param {{ win: number, loss: number, draw: number }} args.record   overall h2h
 * @param {number} args.wonDecks
 * @param {number} args.lostDecks
 * @param {number} args.userStreak      current correct streak
 * @param {string} [args.lastDeckTitle] deck where you last met
 * @returns {string}
 */
export function tauntFor({ name, record, wonDecks, lostDecks, userStreak, lastDeckTitle }) {
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
 *
 * @param {object} args
 * @param {string} args.front        card question text (truncated by caller if needed)
 * @param {number} args.myCorrect
 * @param {number} args.myTotal
 * @param {number} args.theirCorrect
 * @param {number} args.theirTotal
 * @returns {string}
 */
export function cardDuelLine({ front, myCorrect, myTotal, theirCorrect, theirTotal }) {
	const me = myTotal === 0 ? 0 : myCorrect / myTotal;
	const them = theirTotal === 0 ? 0 : theirCorrect / theirTotal;
	if (me > them) return `You own "${front}" — ${Math.round(me * 100)}% vs their ${Math.round(them * 100)}%.`;
	if (me < them) return `They own "${front}" — ${Math.round(them * 100)}% vs your ${Math.round(me * 100)}%.`;
	return `Even on "${front}" at ${Math.round(me * 100)}% — no edge.`;
}
