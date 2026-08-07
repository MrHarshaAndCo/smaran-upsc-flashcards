import { mulberry32 } from './random.js';

/**
 * Deterministic seeded shuffle (FNV-1a hash + mulberry32).
 * Same seed → same order, so SSR and client hydrate identically.
 * @template T
 * @param {T[]} items
 * @param {string} seed
 * @returns {T[]}
 */
export function seededShuffle(items, seed) {
	let h = 2166136261;
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	const rand = mulberry32(h >>> 0);
	const a = [...items];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
