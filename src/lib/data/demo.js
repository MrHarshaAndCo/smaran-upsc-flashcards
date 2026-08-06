/**
 * Deterministic demo data: seeded PRNG so every run of the app (and the
 * benchmark) sees the same peer histories, leaderboard and rivalry.
 */

/** Small deterministic PRNG (mulberry32). */
export function mulberry32(seed) {
	let a = seed >>> 0;
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export const DEMO_USERS = [
	{ name: 'Aarav', avatar: '🦅', skill: 0.82 },
	{ name: 'Meera', avatar: '🌙', skill: 0.76 },
	{ name: 'Rohan', avatar: '⚡', skill: 0.7 },
	{ name: 'Sanya', avatar: '🌸', skill: 0.88 },
	{ name: 'Kabir', avatar: '🏹', skill: 0.65 },
	{ name: 'Priya', avatar: '📚', skill: 0.92 },
	{ name: 'Dev', avatar: '🔱', skill: 0.58 },
	{ name: 'Ananya', avatar: '🌊', skill: 0.72 }
];

const DAY = 86_400_000;
const RATINGS = ['again', 'hard', 'good', 'easy'];

/**
 * Generate deterministic review histories for the demo users.
 *
 * @param {import('./content.js').Deck[]} decks
 * @returns {{ users: Array<{ id: string, name: string, avatar: string, createdAt: number }>, reviews: Array<{ userId: string, cardId: string, deckId: string, rating: 'again'|'hard'|'good'|'easy', ms: number, at: number }> }}
 */
export function generateDemoHistories(decks) {
	const rand = mulberry32(20260806);
	const users = DEMO_USERS.map((u, i) => ({
		id: `demo-${i + 1}`,
		name: u.name,
		avatar: u.avatar,
		createdAt: Date.now() - 90 * DAY
	}));

	const now = Date.now();
	const reviews = [];
	users.forEach((u, ui) => {
		const skill = DEMO_USERS[ui].skill;
		decks.forEach((deck, di) => {
			deck.cards.forEach((card, ci) => {
				// 2-6 review passes per card, spaced over the last 40 days.
				const passes = 2 + Math.floor(rand() * 5);
				let day = 40 - Math.floor(rand() * 10);
				for (let p = 0; p < passes; p++) {
					// A user answers correctly with probability ~skill, slightly
					// worse on hard cards.
					const roll = rand();
					const hard = ci % 5 === 4; // a few hard cards per deck
					const correct = roll < skill - (hard ? 0.15 : 0.05);
					const rating = correct
						? RATINGS[2 + (rand() < 0.4 ? 1 : 0)]
						: rand() < 0.5
							? 'again'
							: 'hard';
					reviews.push({
						userId: u.id,
						cardId: card.id,
						deckId: deck.id,
						rating,
						ms: 1500 + Math.floor(rand() * 6500),
						at: now - day * DAY - Math.floor(rand() * DAY)
					});
					day -= 1 + Math.floor(rand() * 6);
					if (day <= 0) break;
				}
			});
		});
	});
	return { users, reviews };
}
