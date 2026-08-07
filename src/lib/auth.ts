/**
 * Password hashing with Node's built-in scrypt. No external deps.
 * Salted + timing-safe comparison. Async so the event loop never blocks.
 */

import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

/**
 * @param {string} password
 * @param {string} [salt]
 * @returns {Promise<{ salt: string, hash: string }>}
 */
export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
	const hash = await scryptAsync(password, salt, 64);
	return { salt, hash: hash.toString('hex') };
}

/**
 * @param {string} password
 * @param {string} salt
 * @param {string} expectedHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, salt, expectedHash) {
	try {
		const hash = await scryptAsync(password, salt, 64);
		const a = Buffer.from(hash);
		const b = Buffer.from(expectedHash, 'hex');
		return a.length === b.length && timingSafeEqual(a, b);
	} catch {
		return false;
	}
}

/** @param {string} email */
export function isValidEmail(email) {
	return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
