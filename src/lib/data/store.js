/**
 * Data layer. Two interchangeable stores behind one async API:
 *
 * - MockStore   — in-memory, seeded deterministically with demo users and
 *                 review histories. Used when DATABASE_URL is absent (local
 *                 dev, the benchmark harness, quick multi-tester demo).
 * - NeonStore   — same API over Postgres via @neondatabase/serverless.
 *
 * `getStore()` picks Neon when DATABASE_URL is set and falls back to the mock
 * store if Neon is unreachable, so the app never hard-fails.
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'node:fs';
import { DECKS } from './content.js';
import { applyRating, initialCardState } from '../engine/scheduler.js';
import { selectNemesis } from '../engine/nemesis.js';
import { hashPassword, verifyPassword } from '../auth.js';

/**
 * Load DATABASE_URL from .env at runtime unless the environment already sets
 * it. An explicitly set (even empty) DATABASE_URL wins — the benchmark spawns
 * the server with DATABASE_URL='' to stay offline and deterministic.
 */
function loadEnvFile() {
	if (process.env.DATABASE_URL !== undefined) return;
	const file = new URL('../../../.env', import.meta.url);
	if (!existsSync(file)) return;
	for (const line of readFileSync(file, 'utf8').split('\n')) {
		const t = line.trim();
		if (!t || t.startsWith('#')) continue;
		const i = t.indexOf('=');
		if (i < 0) continue;
		const key = t.slice(0, i).trim();
		if (process.env[key] === undefined) process.env[key] = t.slice(i + 1).trim();
	}
}
loadEnvFile();

/**
 * @typedef {{ id: string, title: string, subtitle: string, emoji: string, color: string, blurb: string, cardCount: number }} Deck
 * @typedef {{ id: string, deckId: string, front: string, back: string, hint?: string }} Card
 * @typedef {{ id: string, name: string, avatar: string, createdAt: number }} User
 * @typedef {{ userId: string, cardId: string, deckId: string, rating: 'again'|'hard'|'good'|'easy', ms: number, at: number }} Review
 * @typedef {{ id: number, userId: string, deckId: string, startedAt: number, endedAt: number, results: Array<{ cardId: string, rating: 'again'|'hard'|'good'|'easy', ms: number }> }} Session
 * @typedef {{ ease: number, intervalDays: number, reps: number, lapses: number, due: number }} CardState
 * @typedef {{ userId: string, name: string, avatar: string, accuracy: number, reviews: number, streak: number }} LeaderEntry
 */

const DAY = 86_400_000;

/** Decks as stored (cards flattened separately). */
export const ALL_DECKS = DECKS.map(({ cards, ...deck }) => ({
	...deck,
	cardCount: cards.length
}));

export const ALL_CARDS = DECKS.flatMap((deck) =>
	deck.cards.map((c) => ({ ...c, deckId: deck.id }))
);

/** @param {Review} r */
const isCorrect = (r) => r.rating !== 'again';

class MockStore {
	constructor() {
		/** @type {Map<string, User>} */
		this.users = new Map();
		/** @type {Map<string, Deck>} */
		this.decks = new Map(ALL_DECKS.map((d) => [d.id, d]));
		/** @type {Map<string, Card[]>} */
		this.cardsByDeck = new Map();
		for (const deck of DECKS) this.cardsByDeck.set(deck.id, deck.cards);
		/** @type {Map<string, CardState>} */
		this.states = new Map();
		/** @type {Map<string, Review[]>} */
		this.reviewsByUser = new Map();
		/** @type {Session[]} */
		this.sessions = [];
		/** @type {Map<string, { deviceId: string, userId: string, platform: string, createdAt: number, lastSeen: number }>} */
		this.devices = new Map();
		/** @type {Array<{ id: number, userId: string, quizId: string, startedAt: number, endedAt: number, correct: number, total: number, results: Array<{ questionId: string, correct: boolean, ms: number }> }>} */
		this.quizSessions = [];
		/** @type {Array<{ userId: string, quizId: string, questionId: string, correct: boolean, at: number }>} */
		this.quizAnswers = [];
		this.quizSeq = 0;
		this.sessionSeq = 0;
	}

	async saveQuizSession({ userId, quizId, startedAt, endedAt, results }) {
		const correct = results.filter((r) => r.correct).length;
		this.quizSeq++;
		this.quizSessions.push({ id: this.quizSeq, userId, quizId, startedAt, endedAt, correct, total: results.length, results });
		for (const r of results) {
			this.quizAnswers.push({ userId, quizId, questionId: r.questionId, correct: r.correct, at: startedAt + r.ms });
		}
		return this.quizSeq;
	}

	async getQuizPeerStats(quizId) {
		/** @type {Map<string, { correctCount: number, totalCount: number }>} */
		const out = new Map();
		for (const a of this.quizAnswers) {
			if (a.quizId !== quizId) continue;
			const cur = out.get(a.questionId) ?? { correctCount: 0, totalCount: 0 };
			cur.totalCount++;
			if (a.correct) cur.correctCount++;
			out.set(a.questionId, cur);
		}
		return out;
	}

	async getQuizNemesisStats(userId, quizId) {
		const nemesis = await this.findNemesis(userId);
		if (!nemesis) return null;
		/** @type {Map<string, { correctCount: number, totalCount: number }>} */
		const out = new Map();
		for (const a of this.quizAnswers) {
			if (a.quizId !== quizId || a.userId !== nemesis.userId) continue;
			const cur = out.get(a.questionId) ?? { correctCount: 0, totalCount: 0 };
			cur.totalCount++;
			if (a.correct) cur.correctCount++;
			out.set(a.questionId, cur);
		}
		return out;
	}

	async getUserQuizSessions(userId, limit = 6) {
		return this.quizSessions
			.filter((s) => s.userId === userId)
			.slice(-limit)
			.reverse()
			.map((s) => ({ id: s.id, quizId: s.quizId, startedAt: s.startedAt, endedAt: s.endedAt, correct: s.correct, total: s.total }));
	}

	async addDevice({ deviceId, userId, platform = 'web' }) {
		const now = Date.now();
		this.devices.set(deviceId, { deviceId, userId, platform, createdAt: now, lastSeen: now });
		return { deviceId, platform, createdAt: now, lastSeen: now };
	}

	async listDevices(userId) {
		return [...this.devices.values()]
			.filter((d) => d.userId === userId)
			.sort((a, b) => b.createdAt - a.createdAt)
			.map((d) => ({ deviceId: d.deviceId, platform: d.platform, createdAt: d.createdAt, lastSeen: d.lastSeen }));
	}

	// ---- decks & cards -------------------------------------------------

	async getDecks() {
		return [...this.decks.values()];
	}

	async getDeck(id) {
		return this.decks.get(id) ?? null;
	}

	async getCards(deckId) {
		return this.cardsByDeck.get(deckId) ?? [];
	}

	// ---- users ----------------------------------------------------------

	async getUser(userId) {
		return this.users.get(userId) ?? null;
	}

	async createUser(name, credentials) {
		const id = `u-${crypto.randomUUID()}`;
		let email = null;
		let passwordHash = null;
		let passwordSalt = null;
		if (credentials?.password) {
			const { salt, hash } = await hashPassword(credentials.password);
			email = credentials.email ?? null;
			passwordHash = hash;
			passwordSalt = salt;
		}
		const user = {
			id,
			name: name.trim().slice(0, 24) || 'Aspirant',
			avatar: '📘',
			createdAt: Date.now(),
			email,
			passwordHash,
			passwordSalt
		};
		this.users.set(id, user);
		this.reviewsByUser.set(id, []);
		const { passwordHash: _h, passwordSalt: _s, ...safe } = user;
		return safe;
	}

	async findUserByEmail(email) {
		const needle = email?.trim().toLowerCase();
		if (!needle) return null;
		for (const u of this.users.values()) {
			if (u.email && u.email.toLowerCase() === needle) return u;
		}
		return null;
	}

	async verifyCredentials(email, password) {
		const user = await this.findUserByEmail(email);
		if (!user || !user.passwordHash || !user.passwordSalt) return null;
		const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
		return ok ? user : null;
	}

	async changePassword(userId, currentPassword, newPassword) {
		const user = this.users.get(userId);
		if (!user || !user.passwordHash || !user.passwordSalt) return false;
		const ok = await verifyPassword(currentPassword, user.passwordSalt, user.passwordHash);
		if (!ok) return false;
		const { salt, hash } = await hashPassword(newPassword);
		user.passwordSalt = salt;
		user.passwordHash = hash;
		return true;
	}

	async updateProfile(userId, { name }) {
		const user = this.users.get(userId);
		if (!user) return null;
		if (name && name.trim()) user.name = name.trim().slice(0, 24);
		const { passwordHash, passwordSalt, ...safe } = user;
		return safe;
	}

	async listUsers() {
		return [...this.users.values()];
	}

	async getQuestionFilters() {
		return [];
	}

	async getQuestions() {
		return [];
	}

	async recordNemesisEncounter({ userId, nemesisUserId, quizId, myCorrect, myTotal, theirCorrect, theirTotal, outcome }) {
		this.nemesisSeq = (this.nemesisSeq ?? 0) + 1;
		const entry = { id: this.nemesisSeq, userId, nemesisUserId, quizId, myCorrect, myTotal, theirCorrect, theirTotal, outcome, roast: null, createdAt: Date.now() };
		(this.nemesisHistory = this.nemesisHistory ?? []).push(entry);
		return entry;
	}

	async getNemesisHistory(userId, nemesisUserId, limit = 10) {
		return (this.nemesisHistory ?? []).filter(h => h.userId === userId && h.nemesisUserId === nemesisUserId).slice(-limit).reverse();
	}

	async getNemesisRecord(userId, nemesisUserId) {
		const all = (this.nemesisHistory ?? []).filter(h => h.userId === userId && h.nemesisUserId === nemesisUserId);
		return { wins: all.filter(h => h.outcome === "win").length, losses: all.filter(h => h.outcome === "loss").length, draws: all.filter(h => h.outcome === "draw").length, total: all.length, history: all.slice(-20).reverse() };
	}

	async setNemesisRoast(encounterId, roast) {
		const h = (this.nemesisHistory ?? []).find(h => h.id === encounterId);
		if (h) h.roast = roast;
	}

	// ---- card state & reviews -------------------------------------------

	async getCardStates(userId) {
		const out = new Map();
		for (const [key, st] of this.states) {
			if (key.startsWith(`${userId}:`)) out.set(key.slice(userId.length + 1), st);
		}
		return out;
	}

	async getCardState(userId, cardId) {
		return this.states.get(`${userId}:${cardId}`) ?? null;
	}

	/** @returns {Promise<{ state: CardState, correct: boolean }>} */
	async saveReview({ userId, cardId, deckId, rating, ms = 3000, at = Date.now() }) {
		const prev = this.states.get(`${userId}:${cardId}`) ?? initialCardState(at);
		const state = applyRating(rating, prev);
		this.states.set(`${userId}:${cardId}`, state);
		const list = this.reviewsByUser.get(userId) ?? [];
		list.push({ userId, cardId, deckId, rating, ms, at });
		this.reviewsByUser.set(userId, list);
		return { state, correct: isCorrect({ rating }) };
	}

	async getMyCardMeta(userId, deckId) {
		const out = new Map();
		const list = this.reviewsByUser.get(userId) ?? [];
		for (const r of list) {
			if (r.deckId !== deckId) continue;
			const prev = out.get(r.cardId) ?? { reviewCount: 0, lastAt: 0 };
			out.set(r.cardId, { reviewCount: prev.reviewCount + 1, lastAt: r.at });
		}
		return out;
	}

	// ---- aggregation ------------------------------------------------------

	async getPeerStats(deckId) {
		/** @type {Map<string, { correctCount: number, totalCount: number }>} */
		const out = new Map();
		for (const [uid, list] of this.reviewsByUser) {
			for (const r of list) {
				if (r.deckId !== deckId) continue;
				const cur = out.get(r.cardId) ?? { correctCount: 0, totalCount: 0 };
				cur.totalCount++;
				if (isCorrect(r)) cur.correctCount++;
				out.set(r.cardId, cur);
			}
		}
		return out;
	}

	async getNemesisStats(userId, deckId) {
		const nemesis = await this.findNemesis(userId);
		if (!nemesis) return null;
		/** @type {Map<string, { correctCount: number, totalCount: number }>} */
		const out = new Map();
		for (const r of this.reviewsByUser.get(nemesis.userId) ?? []) {
			if (r.deckId !== deckId) continue;
			const cur = out.get(r.cardId) ?? { correctCount: 0, totalCount: 0 };
			cur.totalCount++;
			if (isCorrect(r)) cur.correctCount++;
			out.set(r.cardId, cur);
		}
		return out;
	}

	async findNemesis(userId) {
		return this.pickNemesis(userId);
	}

	async pickNemesis(userId) {
		const entries = (await this.leaderboardEntries()).filter((e) => e.reviews > 0);
		const user = await this.getUser(userId);
		if (!user) return null;
		const summary = await this.getUserSummary(userId);
		const me = {
			userId,
			name: user.name,
			avatar: user.avatar,
			accuracy: summary.total === 0 ? 0 : summary.correct / summary.total,
			reviews: summary.total,
			streak: summary.streak
		};
		return selectNemesis(userId, [...entries.filter((e) => e.userId !== userId), me]);
	}

	async leaderboardEntries(deckId) {
		const entries = [];
		for (const [uid, list] of this.reviewsByUser) {
			if (!this.users.has(uid)) continue;
			let correct = 0;
			let total = 0;
			for (const r of list) {
				if (deckId && r.deckId !== deckId) continue;
				total++;
				if (isCorrect(r)) correct++;
			}
			const user = this.users.get(uid);
			entries.push({
				userId: uid,
				name: user.name,
				avatar: user.avatar,
				accuracy: total === 0 ? 0 : correct / total,
				reviews: total,
				streak: this.streakFor(uid)
			});
		}
		return entries.sort(
			(a, b) => b.accuracy - a.accuracy || b.reviews - a.reviews || a.name.localeCompare(b.name)
		);
	}

	streakFor(userId) {
		const list = this.reviewsByUser.get(userId) ?? [];
		let streak = 0;
		for (let i = list.length - 1; i >= 0; i--) {
			if (isCorrect(list[i])) streak++;
			else break;
		}
		return streak;
	}

	async getUserSummary(userId) {
		const list = this.reviewsByUser.get(userId) ?? [];
		let correct = 0;
		const perDeck = new Map();
		const deckDue = new Map();
		for (const r of list) {
			if (isCorrect(r)) correct++;
			const d = perDeck.get(r.deckId) ?? { correct: 0, total: 0 };
			d.total++;
			if (isCorrect(r)) d.correct++;
			perDeck.set(r.deckId, d);
		}
		const now = Date.now();
		const cards = await this.getCardStates(userId);
		for (const [cardId, st] of cards) {
			const deckId = ALL_CARDS.find((c) => c.id === cardId)?.deckId;
			if (!deckId) continue;
			if (st.due <= now) {
				deckDue.set(deckId, (deckDue.get(deckId) ?? 0) + 1);
			}
		}
		const deckRows = [];
		for (const d of this.decks.values()) {
			const s = perDeck.get(d.id) ?? { correct: 0, total: 0 };
			deckRows.push({
				deckId: d.id,
				title: d.title,
				emoji: d.emoji,
				color: d.color,
				correct: s.correct,
				total: s.total,
				due: deckDue.get(d.id) ?? 0
			});
		}
		return {
			correct,
			total: list.length,
			streak: this.streakFor(userId),
			dueCount: [...deckDue.values()].reduce((a, b) => a + b, 0),
			perDeck: deckRows
		};
	}

	async getUserSessions(userId, limit = 8) {
		const mine = this.sessions.filter((s) => s.userId === userId).slice(-limit).reverse();
		return mine.map((s) => {
			const deck = this.decks.get(s.deckId);
			const correct = s.results.filter((r) => r.rating !== 'again').length;
			return {
				id: s.id,
				deckId: s.deckId,
				deckTitle: deck?.title ?? 'Unknown deck',
				emoji: deck?.emoji ?? '📘',
				startedAt: s.startedAt,
				endedAt: s.endedAt,
				correct,
				total: s.results.length
			};
		});
	}

	async saveSession({ userId, deckId, startedAt, endedAt, results }) {
		for (const r of results) {
			await this.saveReview({
				userId,
				cardId: r.cardId,
				deckId,
				rating: r.rating,
				ms: r.ms,
				at: startedAt + r.ms
			});
		}
		this.sessionSeq++;
		const session = {
			id: this.sessionSeq,
			userId,
			deckId,
			startedAt,
			endedAt,
			results
		};
		this.sessions.push(session);
		return session.id;
	}

	async h2hAcrossDecks(userId, otherUserId) {
		const mine = this.reviewsByUser.get(userId) ?? [];
		const theirs = this.reviewsByUser.get(otherUserId) ?? [];
		const agg = (list) => {
			const m = new Map();
			for (const r of list) {
				const cur = m.get(r.deckId) ?? { correct: 0, total: 0 };
				cur.total++;
				if (isCorrect(r)) cur.correct++;
				m.set(r.deckId, cur);
			}
			return m;
		};
		const a = agg(mine);
		const b = agg(theirs);
		const out = [];
		for (const d of this.decks.values()) {
			const x = a.get(d.id) ?? { correct: 0, total: 0 };
			const y = b.get(d.id) ?? { correct: 0, total: 0 };
			if (x.total === 0 && y.total === 0) continue;
			out.push({ deckId: d.id, deckTitle: d.title, emoji: d.emoji, myCorrect: x.correct, myTotal: x.total, theirCorrect: y.correct, theirTotal: y.total });
		}
		return out;
	}

	async getCardDuels(userId, otherUserId, deckId) {
		const cards = deckId ? this.cardsByDeck.get(deckId) ?? [] : ALL_CARDS;
		const agg = (list, uid) => {
			const m = new Map();
			for (const r of list) {
				if (r.userId !== uid) continue;
				if (deckId && r.deckId !== deckId) continue;
				const cur = m.get(r.cardId) ?? { correct: 0, total: 0 };
				cur.total++;
				if (isCorrect(r)) cur.correct++;
				m.set(r.cardId, cur);
			}
			return m;
		};
		const a = agg(this.reviewsByUser.get(userId) ?? [], userId);
		const b = agg(this.reviewsByUser.get(otherUserId) ?? [], otherUserId);
		const out = [];
		for (const card of cards) {
			const x = a.get(card.id);
			const y = b.get(card.id);
			if (!x || !y) continue;
			out.push({
				cardId: card.id,
				front: card.front,
				myCorrect: x.correct,
				myTotal: x.total,
				theirCorrect: y.correct,
				theirTotal: y.total
			});
		}
		return out.sort((p, q) => Math.abs(q.myCorrect / q.myTotal - q.theirCorrect / q.theirTotal) - Math.abs(p.myCorrect / p.myTotal - p.theirCorrect / p.theirTotal));
	}
}

const SCHEMA_STATEMENTS = [
	`CREATE TABLE IF NOT EXISTS users (
	  id text primary key, name text not null, avatar text not null,
	  created_at bigint not null
	)`,
	'ALTER TABLE users ADD COLUMN IF NOT EXISTS email text',
	'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text',
	'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt text',
	'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email) WHERE email IS NOT NULL',
	`CREATE TABLE IF NOT EXISTS decks (
	  id text primary key, title text not null, subtitle text not null,
	  emoji text not null, color text not null, blurb text not null,
	  card_count int not null default 0
	)`,
	`CREATE TABLE IF NOT EXISTS cards (
	  id text primary key, deck_id text not null references decks(id),
	  front text not null, back text not null, hint text
	)`,
	`CREATE TABLE IF NOT EXISTS card_states (
	  user_id text not null, card_id text not null,
	  ease real not null, interval_days real not null, reps int not null,
	  lapses int not null, due bigint not null, last_rating text,
	  primary key (user_id, card_id)
	)`,
	`CREATE TABLE IF NOT EXISTS reviews (
	  id bigserial primary key, user_id text not null, card_id text not null,
	  deck_id text not null, rating text not null, ms int not null, at bigint not null
	)`,
	`CREATE TABLE IF NOT EXISTS sessions (
	  id bigserial primary key, user_id text not null, deck_id text not null,
	  started_at bigint not null, ended_at bigint not null, results jsonb not null
	)`,
	`CREATE TABLE IF NOT EXISTS devices (
	  device_id text primary key, user_id text not null,
	  platform text not null default 'web',
	  created_at bigint not null, last_seen bigint not null
	)`,
	`CREATE TABLE IF NOT EXISTS quiz_sessions (
	  id bigserial primary key, user_id text not null, quiz_id text not null,
	  started_at bigint not null, ended_at bigint not null,
	  correct int not null, total int not null, results jsonb not null
	)`,
	`CREATE TABLE IF NOT EXISTS quiz_answers (
	  id bigserial primary key, user_id text not null, quiz_id text not null,
	  question_id text not null, correct boolean not null, at bigint not null
	)`,
	`CREATE TABLE IF NOT EXISTS questions (
	  id text primary key, subject text not null, sub_topic text,
	  question text not null, options jsonb not null, answer_index int not null,
	  explanation text, created_at bigint not null default 0
	)`,
	'CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews (user_id, deck_id)',
	'CREATE INDEX IF NOT EXISTS idx_states_user ON card_states (user_id)',
	'CREATE INDEX IF NOT EXISTS idx_devices_user ON devices (user_id)',
	'CREATE INDEX IF NOT EXISTS idx_quiz_answers_quiz ON quiz_answers (quiz_id, question_id)',
	'CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions (user_id)',
	'CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions (subject)',
	'CREATE INDEX IF NOT EXISTS idx_questions_subtopic ON questions (sub_topic)',
`CREATE TABLE IF NOT EXISTS nemesis_history (
  id bigserial primary key, user_id text not null, nemesis_user_id text not null,
  quiz_id text not null, my_correct int not null, my_total int not null,
  their_correct int not null, their_total int not null,
  outcome text not null, roast text, created_at bigint not null
)`,
'CREATE INDEX IF NOT EXISTS idx_nemesis_history_users ON nemesis_history (user_id, nemesis_user_id, created_at DESC)',
];

class NeonStore {
	/** @param {string} connectionString */
	constructor(connectionString) {
		this.sql = neon(connectionString);
	}

	async init() {
		for (const stmt of SCHEMA_STATEMENTS) {
			await this.sql(stmt);
		}
		const [{ n }] = await this.sql('SELECT count(*)::int AS n FROM decks');
		if (n === 0) {
			for (const d of ALL_DECKS) {
				await this.sql(
					'INSERT INTO decks (id, title, subtitle, emoji, color, blurb, card_count) VALUES ($1,$2,$3,$4,$5,$6,$7)',
					[d.id, d.title, d.subtitle, d.emoji, d.color, d.blurb, d.cardCount]
				);
			}
			for (const c of ALL_CARDS) {
				await this.sql(
					'INSERT INTO cards (id, deck_id, front, back, hint) VALUES ($1,$2,$3,$4,$5)',
					[c.id, c.deckId, c.front, c.back, c.hint ?? null]
				);
			}
		}
	}

	async getDecks() {
		return this.sql('SELECT id, title, subtitle, emoji, color, blurb, card_count AS "cardCount" FROM decks ORDER BY id');
	}

	async getDeck(id) {
		const rows = await this.sql('SELECT id, title, subtitle, emoji, color, blurb, card_count AS "cardCount" FROM decks WHERE id = $1', [id]);
		return rows[0] ?? null;
	}

	async getCards(deckId) {
		return this.sql('SELECT id, deck_id AS "deckId", front, back, hint FROM cards WHERE deck_id = $1 ORDER BY id', [deckId]);
	}

	async getUser(userId) {
		const rows = await this.sql('SELECT id, name, avatar, email, created_at AS createdAt FROM users WHERE id = $1', [userId]);
		return rows[0] ?? null;
	}

	async createUser(name, credentials) {
		const id = `u-${crypto.randomUUID()}`;
		let email = null;
		let passwordHash = null;
		let passwordSalt = null;
		if (credentials?.password) {
			const { salt, hash } = await hashPassword(credentials.password);
			email = credentials.email ?? null;
			passwordHash = hash;
			passwordSalt = salt;
		}
		await this.sql(
			'INSERT INTO users (id, name, avatar, created_at, email, password_hash, password_salt) VALUES ($1,$2,$3,$4,$5,$6,$7)',
			[id, name.trim().slice(0, 24) || 'Aspirant', '📘', Date.now(), email, passwordHash, passwordSalt]
		);
		return { id, name, avatar: '📘', createdAt: Date.now(), email };
	}

	async findUserByEmail(email) {
		const needle = email?.trim().toLowerCase();
		if (!needle) return null;
		const rows = await this.sql(
			'SELECT id, name, avatar, created_at AS createdAt, email, password_hash AS "passwordHash", password_salt AS "passwordSalt" FROM users WHERE lower(email) = $1',
			[needle]
		);
		return rows[0] ?? null;
	}

	async verifyCredentials(email, password) {
		const user = await this.findUserByEmail(email);
		if (!user || !user.passwordHash || !user.passwordSalt) return null;
		const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
		if (!ok) return null;
		return { id: user.id, name: user.name, avatar: user.avatar, createdAt: user.createdAt };
	}


	async changePassword(userId, currentPassword, newPassword) {
		const rows = await this.sql(
			'SELECT id, password_hash AS "passwordHash", password_salt AS "passwordSalt" FROM users WHERE id = $1',
			[userId]
		);
		const user = rows[0];
		if (!user || !user.passwordHash || !user.passwordSalt) return false;
		const ok = await verifyPassword(currentPassword, user.passwordSalt, user.passwordHash);
		if (!ok) return false;
		const { salt, hash } = await hashPassword(newPassword);
		await this.sql("UPDATE users SET password_hash = $2, password_salt = $3 WHERE id = $1", [userId, hash, salt]);
		return true;
	}

	async updateProfile(userId, { name }) {
		const clean = name?.trim().slice(0, 24);
		if (!clean) return this.getUser(userId);
		await this.sql("UPDATE users SET name = $2 WHERE id = $1", [userId, clean]);
		return this.getUser(userId);
	}
	async listUsers() {
		return this.sql('SELECT id, name, avatar, created_at AS createdAt FROM users');
	}

	async getCardStates(userId) {
		const rows = await this.sql('SELECT card_id AS "cardId", ease, interval_days AS "intervalDays", reps, lapses, due FROM card_states WHERE user_id = $1', [userId]);
		const out = new Map();
		for (const r of rows) out.set(r.cardId, { ease: r.ease, intervalDays: r.intervalDays, reps: r.reps, lapses: r.lapses, due: r.due });
		return out;
	}

	async getCardState(userId, cardId) {
		const rows = await this.sql('SELECT ease, interval_days AS "intervalDays", reps, lapses, due FROM card_states WHERE user_id = $1 AND card_id = $2', [userId, cardId]);
		return rows[0] ?? null;
	}

	async saveReview({ userId, cardId, deckId, rating, ms = 3000, at = Date.now() }) {
		const prev = (await this.getCardState(userId, cardId)) ?? initialCardState(at);
		const state = applyRating(rating, prev);
		await this.sql(
			`INSERT INTO card_states (user_id, card_id, ease, interval_days, reps, lapses, due, last_rating)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
			 ON CONFLICT (user_id, card_id) DO UPDATE SET
			   ease = EXCLUDED.ease, interval_days = EXCLUDED.interval_days,
			   reps = EXCLUDED.reps, lapses = EXCLUDED.lapses,
			   due = EXCLUDED.due, last_rating = EXCLUDED.last_rating`,
			[userId, cardId, state.ease, state.intervalDays, state.reps, state.lapses, state.due, rating]
		);
		await this.sql('INSERT INTO reviews (user_id, card_id, deck_id, rating, ms, at) VALUES ($1,$2,$3,$4,$5,$6)', [
			userId,
			cardId,
			deckId,
			rating,
			ms,
			at
		]);
		return { state, correct: rating !== 'again' };
	}

	async getMyCardMeta(userId, deckId) {
		const rows = await this.sql(
			'SELECT card_id AS "cardId", count(*)::int AS "reviewCount", max(at) AS "lastAt" FROM reviews WHERE user_id = $1 AND deck_id = $2 GROUP BY card_id',
			[userId, deckId]
		);
		const out = new Map();
		for (const r of rows) out.set(r.cardId, { reviewCount: r.reviewCount, lastAt: r.lastAt });
		return out;
	}

	async getPeerStats(deckId) {
		const rows = await this.sql(
			`SELECT card_id AS "cardId",
			        count(*)::int AS "totalCount",
			        count(*) FILTER (WHERE rating <> 'again')::int AS "correctCount"
			 FROM reviews WHERE deck_id = $1
			 GROUP BY card_id`,
			[deckId]
		);
		const out = new Map();
		for (const r of rows) out.set(r.cardId, { correctCount: r.correctCount, totalCount: r.totalCount });
		return out;
	}

	async getNemesisStats(userId, deckId) {
		const nemesis = await this.findNemesis(userId);
		if (!nemesis) return null;
		const rows = await this.sql(
			`SELECT card_id AS "cardId",
			        count(*)::int AS "totalCount",
			        count(*) FILTER (WHERE rating <> 'again')::int AS "correctCount"
			 FROM reviews WHERE deck_id = $1 AND user_id = $2 GROUP BY card_id`,
			[deckId, nemesis.userId]
		);
		const out = new Map();
		for (const r of rows) out.set(r.cardId, { correctCount: r.correctCount, totalCount: r.totalCount });
		return out;
	}

	async findNemesis(userId) {
		return this.pickNemesis(userId);
	}

	async pickNemesis(userId) {
		const entries = (await this.leaderboardEntries()).filter((e) => e.reviews > 0);
		const user = await this.getUser(userId);
		if (!user) return null;
		const summary = await this.getUserSummary(userId);
		const me = {
			userId,
			name: user.name,
			avatar: user.avatar,
			accuracy: summary.total === 0 ? 0 : summary.correct / summary.total,
			reviews: summary.total,
			streak: summary.streak
		};
		return selectNemesis(userId, [...entries.filter((e) => e.userId !== userId), me]);
	}

	async leaderboardEntries(deckId) {
		const filter = deckId ? 'WHERE deck_id = $1' : '';
		const params = deckId ? [deckId] : [];
		const rows = await this.sql(
			`SELECT user_id AS "userId", count(*)::int AS total,
			        count(*) FILTER (WHERE rating <> 'again')::int AS correct
			 FROM reviews ${filter} GROUP BY user_id`,
			params
		);
		const users = await this.listUsers();
		const byId = new Map(users.map((u) => [u.id, u]));
		const entries = rows
			.map((r) => {
				const u = byId.get(r.userId);
				return {
					userId: r.userId,
					name: u?.name ?? 'Unknown',
					avatar: u?.avatar ?? '📘',
					accuracy: r.total === 0 ? 0 : r.correct / r.total,
					reviews: r.total,
					streak: 0
				};
			})
			.filter((e) => e.reviews > 0);
		return entries.sort(
			(a, b) => b.accuracy - a.accuracy || b.reviews - a.reviews || a.name.localeCompare(b.name)
		);
	}

	async getUserSummary(userId) {
		const rows = await this.sql(
			`SELECT deck_id AS "deckId",
			        count(*)::int AS total,
			        count(*) FILTER (WHERE rating <> 'again')::int AS correct
			 FROM reviews WHERE user_id = $1 GROUP BY deck_id`,
			[userId]
		);
		const dueRows = await this.sql(
			`SELECT c.deck_id AS "deckId", count(*)::int AS due
			 FROM card_states s JOIN cards c ON c.id = s.card_id
			 WHERE s.user_id = $1 AND s.due <= $2 GROUP BY c.deck_id`,
			[userId, Date.now()]
		);
		const decks = await this.getDecks();
		const perDeck = [];
		const byDeck = new Map(rows.map((r) => [r.deckId, r]));
		const dueByDeck = new Map(dueRows.map((r) => [r.deckId, r.due]));
		for (const d of decks) {
			const s = byDeck.get(d.id) ?? { total: 0, correct: 0 };
			perDeck.push({
				deckId: d.id,
				title: d.title,
				emoji: d.emoji,
				color: d.color,
				correct: s.correct,
				total: s.total,
				due: dueByDeck.get(d.id) ?? 0
			});
		}
		const total = rows.reduce((a, r) => a + r.total, 0);
		const correct = rows.reduce((a, r) => a + r.correct, 0);
		return {
			correct,
			total,
			streak: 0,
			dueCount: dueRows.reduce((a, r) => a + r.due, 0),
			perDeck
		};
	}

	async getUserSessions(userId, limit = 8) {
		const rows = await this.sql(
			`SELECT s.id, s.deck_id AS "deckId", s.started_at AS "startedAt", s.ended_at AS "endedAt", s.results
			 FROM sessions s WHERE s.user_id = $1 ORDER BY s.ended_at DESC LIMIT $2`,
			[userId, limit]
		);
		const decks = await this.getDecks();
		const byId = new Map(decks.map((d) => [d.id, d]));
		return rows.map((s) => {
			const deck = byId.get(s.deckId);
			const results = s.results ?? [];
			return {
				id: s.id,
				deckId: s.deckId,
				deckTitle: deck?.title ?? 'Unknown deck',
				emoji: deck?.emoji ?? '📘',
				startedAt: s.startedAt,
				endedAt: s.endedAt,
				correct: results.filter((r) => r.rating !== 'again').length,
				total: results.length
			};
		});
	}

	async saveSession({ userId, deckId, startedAt, endedAt, results }) {
		for (const r of results) {
			await this.saveReview({ userId, cardId: r.cardId, deckId, rating: r.rating, ms: r.ms, at: startedAt + r.ms });
		}
		const rows = await this.sql(
			'INSERT INTO sessions (user_id, deck_id, started_at, ended_at, results) VALUES ($1,$2,$3,$4,$5::jsonb) RETURNING id',
			[userId, deckId, startedAt, endedAt, JSON.stringify(results)]
		);
		return rows[0].id;
	}

	async h2hAcrossDecks(userId, otherUserId) {
		const rows = await this.sql(
			`SELECT deck_id AS "deckId",
			        count(*) FILTER (WHERE user_id = $1 AND rating <> 'again')::int AS myCorrect,
			        count(*) FILTER (WHERE user_id = $1)::int AS myTotal,
			        count(*) FILTER (WHERE user_id = $2 AND rating <> 'again')::int AS theirCorrect,
			        count(*) FILTER (WHERE user_id = $2)::int AS theirTotal
			 FROM reviews WHERE user_id IN ($1, $2) GROUP BY deck_id`,
			[userId, otherUserId]
		);
		const decks = await this.getDecks();
		const byId = new Map(decks.map((d) => [d.id, d]));
		return rows
			.filter((r) => r.myTotal > 0 || r.theirTotal > 0)
			.map((r) => ({
				deckId: r.deckId,
				deckTitle: byId.get(r.deckId)?.title ?? 'Unknown',
				emoji: byId.get(r.deckId)?.emoji ?? '📘',
				myCorrect: r.myCorrect,
				myTotal: r.myTotal,
				theirCorrect: r.theirCorrect,
				theirTotal: r.theirTotal
			}));
	}

	async addDevice({ deviceId, userId, platform = 'web' }) {
		const now = Date.now();
		await this.sql(
			`INSERT INTO devices (device_id, user_id, platform, created_at, last_seen)
			 VALUES ($1,$2,$3,$4,$4)
			 ON CONFLICT (device_id) DO UPDATE SET
			   user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, last_seen = EXCLUDED.last_seen`,
			[deviceId, userId, platform, now]
		);
		return { deviceId, platform, createdAt: now, lastSeen: now };
	}

	async listDevices(userId) {
		return this.sql(
			'SELECT device_id AS "deviceId", platform, created_at AS createdAt, last_seen AS "lastSeen" FROM devices WHERE user_id = $1 ORDER BY created_at DESC',
			[userId]
		);
	}

	async saveQuizSession({ userId, quizId, startedAt, endedAt, results }) {
		const correct = results.filter((r) => r.correct).length;
		const rows = await this.sql(
			'INSERT INTO quiz_sessions (user_id, quiz_id, started_at, ended_at, correct, total, results) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING id',
			[userId, quizId, startedAt, endedAt, correct, results.length, JSON.stringify(results)]
		);
		if (results.length > 0) {
			const vals = results
				.map((r) => `('${userId}','${quizId}','${r.questionId}',${r.correct},${startedAt + r.ms})`)
				.join(',');
			await this.sql(`INSERT INTO quiz_answers (user_id, quiz_id, question_id, correct, at) VALUES ${vals}`);
		}
		return rows[0].id;
	}

	async getQuizPeerStats(quizId) {
		const rows = await this.sql(
			`SELECT question_id AS "questionId",
			        count(*)::int AS "totalCount",
			        count(*) FILTER (WHERE correct)::int AS "correctCount"
			 FROM quiz_answers WHERE quiz_id = $1 GROUP BY question_id`,
			[quizId]
		);
		const out = new Map();
		for (const r of rows) out.set(r.questionId, { correctCount: r.correctCount, totalCount: r.totalCount });
		return out;
	}

	async getQuizNemesisStats(userId, quizId) {
		const nemesis = await this.findNemesis(userId);
		if (!nemesis) return null;
		const rows = await this.sql(
			`SELECT question_id AS "questionId",
			        count(*)::int AS "totalCount",
			        count(*) FILTER (WHERE correct)::int AS "correctCount"
			 FROM quiz_answers WHERE quiz_id = $1 AND user_id = $2 GROUP BY question_id`,
			[quizId, nemesis.userId]
		);
		const out = new Map();
		for (const r of rows) out.set(r.questionId, { correctCount: r.correctCount, totalCount: r.totalCount });
		return out;
	}

	async getUserQuizSessions(userId, limit = 6) {
		const rows = await this.sql(
			'SELECT id, quiz_id AS quizId, started_at AS "startedAt", ended_at AS "endedAt", correct, total FROM quiz_sessions WHERE user_id = $1 ORDER BY ended_at DESC LIMIT $2',
			[userId, limit]
		);
		return rows.map((r) => ({ id: r.id, quizId: r.quizId, startedAt: r.startedAt, endedAt: r.endedAt, correct: r.correct, total: r.total }));
	}

	async getQuestionFilters() {
		const rows = await this.sql(
			`SELECT subject,
			        count(*)::int AS n,
			        jsonb_agg(DISTINCT jsonb_build_object('name', sub_topic, 'count', sub_count)) AS subtopics
			 FROM (
			   SELECT subject, sub_topic, count(*)::int AS sub_count
			   FROM questions WHERE sub_topic IS NOT NULL
			   GROUP BY subject, sub_topic
			 ) t
			 GROUP BY subject ORDER BY subject`
		);
		return rows.map((r) => ({
			subject: r.subject,
			count: r.n,
			subTopics: (r.subtopics ?? []).map((s) => ({ name: s.name, count: s.count }))
		}));
	}

	async getQuestions({ subject = null, subTopic = null, limit = 20 } = {}) {
		const conds = [];
		const params = [];
		if (subject) {
			params.push(subject);
			conds.push(`subject = $${params.length}`);
		}
		if (subTopic) {
			params.push(subTopic);
			conds.push(`sub_topic = $${params.length}`);
		}
		params.push(Math.min(Math.max(limit, 1), 100));
		const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
		const rows = await this.sql(
			`SELECT id, subject, sub_topic AS "subTopic", question, options, answer_index AS "answerIndex", explanation
			 FROM questions ${where} ORDER BY random() LIMIT $${params.length}`,
			params
		);
		return rows.map((r) => ({
			id: r.id,
			subject: r.subject,
			subTopic: r.subTopic,
			question: r.question,
			options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options,
			answerIndex: r.answerIndex,
			explanation: r.explanation
		}));
	}


	async recordNemesisEncounter({ userId, nemesisUserId, quizId, myCorrect, myTotal, theirCorrect, theirTotal, outcome }) {
		const rows = await this.sql(
			"INSERT INTO nemesis_history (user_id, nemesis_user_id, quiz_id, my_correct, my_total, their_correct, their_total, outcome, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
			[userId, nemesisUserId, quizId, myCorrect, myTotal, theirCorrect, theirTotal, outcome, Date.now()]
		);
		return { id: rows[0].id };
	}

	async getNemesisHistory(userId, nemesisUserId, limit = 10) {
		return this.sql(
			"SELECT id, user_id AS userId, nemesis_user_id AS nemesisUserId, quiz_id AS quizId, my_correct AS myCorrect, my_total AS myTotal, their_correct AS theirCorrect, their_total AS theirTotal, outcome, roast, created_at AS createdAt FROM nemesis_history WHERE user_id = $1 AND nemesis_user_id = $2 ORDER BY created_at DESC LIMIT $3",
			[userId, nemesisUserId, limit]
		);
	}

	async getNemesisRecord(userId, nemesisUserId) {
		const all = await this.sql(
			"SELECT outcome FROM nemesis_history WHERE user_id = $1 AND nemesis_user_id = $2",
			[userId, nemesisUserId]
		);
		const wins = all.filter(h => h.outcome === "win").length;
		const losses = all.filter(h => h.outcome === "loss").length;
		const draws = all.filter(h => h.outcome === "draw").length;
		const history = await this.getNemesisHistory(userId, nemesisUserId, 20);
		return { wins, losses, draws, total: all.length, history };
	}

	async setNemesisRoast(encounterId, roast) {
		await this.sql("UPDATE nemesis_history SET roast = $2 WHERE id = $1", [encounterId, roast]);
	}
	async getCardDuels(userId, otherUserId, deckId) {
		const filter = deckId ? 'AND deck_id = $3' : '';
		const params = deckId ? [userId, otherUserId, deckId] : [userId, otherUserId];
		const rows = await this.sql(
			`SELECT card_id AS "cardId",
			        count(*) FILTER (WHERE user_id = $1 AND rating <> 'again')::int AS myCorrect,
			        count(*) FILTER (WHERE user_id = $1)::int AS myTotal,
			        count(*) FILTER (WHERE user_id = $2 AND rating <> 'again')::int AS theirCorrect,
			        count(*) FILTER (WHERE user_id = $2)::int AS theirTotal
			 FROM reviews WHERE user_id IN ($1, $2) ${filter} GROUP BY card_id`,
			params
		);
		const cards = deckId ? await this.getCards(deckId) : ALL_CARDS;
		const byId = new Map(cards.map((c) => [c.id, c]));
		return rows
			.map((r) => ({
				cardId: r.cardId,
				front: byId.get(r.cardId)?.front ?? '',
				myCorrect: r.myCorrect,
				myTotal: r.myTotal,
				theirCorrect: r.theirCorrect,
				theirTotal: r.theirTotal
			}))
			.sort(
				(p, q) =>
					Math.abs(q.myCorrect / q.myTotal - q.theirCorrect / q.theirTotal) -
					Math.abs(p.myCorrect / p.myTotal - p.theirCorrect / p.theirTotal)
			);
	}
}

let storePromise = null;

/**
 * @returns {Promise<import('./store.js').Store>}
 */
export function getStore() {
	if (!storePromise) {
		storePromise = (async () => {
			const url = process.env.DATABASE_URL;
			if (url) {
				try {
					const neonStore = new NeonStore(url);
					await neonStore.init();
					return neonStore;
				} catch (e) {
					console.warn(`[smaran] Neon unavailable (${e.message}); falling back to demo store.`);
				}
			}
			return new MockStore();
		})();
	}
	return storePromise;
}

/** Reset (test/benchmark only). */
export function _resetStore() {
	storePromise = null;
}

/**
 * @typedef {object} Store
 * @property {() => Promise<Deck[]>} getDecks
 * @property {(id: string) => Promise<Deck|null>} getDeck
 * @property {(deckId: string) => Promise<Card[]>} getCards
 * @property {(userId: string) => Promise<User|null>} getUser
 * @property {(name: string, credentials?: { email?: string, password?: string }) => Promise<User>} createUser
 * @property {(email: string) => Promise<User|null>} findUserByEmail
 * @property {(email: string, password: string) => Promise<User|null>} verifyCredentials
 * @property {(userId: string, currentPassword: string, newPassword: string) => Promise<boolean>} changePassword
 * @property {(userId: string, args: { name?: string }) => Promise<User|null>} updateProfile
 * @property {() => Promise<Array<{ subject: string, count: number, subTopics: Array<{ name: string, count: number }> }>>} getQuestionFilters
 * @property {(args?: { subject?: string|null, subTopic?: string|null, limit?: number }) => Promise<Array<{ id: string, subject: string, subTopic: string|null, question: string, options: string[], answerIndex: number, explanation: string|null }>>} getQuestions
 * @property {() => Promise<User[]>} listUsers
 * @property {(userId: string) => Promise<Map<string, CardState>>} getCardStates
 * @property {(userId: string, cardId: string) => Promise<CardState|null>} getCardState
 * @property {(args: { userId: string, cardId: string, deckId: string, rating: 'again'|'hard'|'good'|'easy', ms?: number, at?: number }) => Promise<{ state: CardState, correct: boolean }>} saveReview
 * @property {(userId: string, deckId: string) => Promise<Map<string, { reviewCount: number, lastAt: number }>>} getMyCardMeta
 * @property {(deckId: string) => Promise<Map<string, { correctCount: number, totalCount: number }>>} getPeerStats
 * @property {(userId: string, deckId: string) => Promise<Map<string, { correctCount: number, totalCount: number }>|null>} getNemesisStats
 * @property {(userId: string) => Promise<{ userId: string }|null>} findNemesis
 * @property {(deckId?: string) => Promise<LeaderEntry[]>} leaderboardEntries
 * @property {(userId: string) => Promise<{ correct: number, total: number, streak: number, dueCount: number, perDeck: Array<{ deckId: string, title: string, emoji: string, color: string, correct: number, total: number, due: number }> }>} getUserSummary
 * @property {(userId: string, limit?: number) => Promise<Array<{ id: number, deckId: string, deckTitle: string, emoji: string, startedAt: number, endedAt: number, correct: number, total: number }>>} getUserSessions
 * @property {(args: { userId: string, deckId: string, startedAt: number, endedAt: number, results: Array<{ cardId: string, rating: 'again'|'hard'|'good'|'easy', ms: number }> }) => Promise<number>} saveSession
 * @property {(userId: string, otherUserId: string) => Promise<Array<{ deckId: string, deckTitle: string, emoji: string, myCorrect: number, myTotal: number, theirCorrect: number, theirTotal: number }>>} h2hAcrossDecks
 * @property {(userId: string, otherUserId: string, deckId?: string) => Promise<Array<{ cardId: string, front: string, myCorrect: number, myTotal: number, theirCorrect: number, theirTotal: number }>>} getCardDuels
 * @property {(args: { deviceId: string, userId: string, platform?: string }) => Promise<{ deviceId: string, platform: string, createdAt: number, lastSeen: number }>} addDevice
 * @property {(userId: string) => Promise<Array<{ deviceId: string, platform: string, createdAt: number, lastSeen: number }>>} listDevices
 * @property {(args: { userId: string, quizId: string, startedAt: number, endedAt: number, results: Array<{ questionId: string, correct: boolean, ms: number }> }) => Promise<number>} saveQuizSession
 * @property {(quizId: string) => Promise<Map<string, { correctCount: number, totalCount: number }>>} getQuizPeerStats
 * @property {(userId: string, quizId: string) => Promise<Map<string, { correctCount: number, totalCount: number }>|null>} getQuizNemesisStats
 * @property {(userId: string, limit?: number) => Promise<Array<{ id: number, quizId: string, startedAt: number, endedAt: number, correct: number, total: number }>>} getUserQuizSessions
 */
