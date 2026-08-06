/**
 * Generates static/icons/icon-{192,512}.png — pure Node, no deps.
 * Design: navy rounded square, two cream flashcards, saffron progress bar
 * and a saffron dot (the Smaran mark).
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'static', 'icons');
mkdirSync(OUT, { recursive: true });

const CRC_TABLE = new Int32Array(256).map((_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c;
});

function crc32(buf) {
	let c = -1;
	for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
	return (c ^ -1) >>> 0;
}

function chunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length);
	const typeBuf = Buffer.from(type, 'ascii');
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
	return Buffer.concat([len, typeBuf, data, crc]);
}

function png(width, height, rgba) {
	const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	const raw = Buffer.alloc((width * 4 + 1) * height);
	for (let y = 0; y < height; y++) {
		raw[y * (width * 4 + 1)] = 0;
		rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
	}
	const idat = deflateSync(raw, { level: 9 });
	return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const NAVY = [20, 38, 63];
const CREAM = [246, 241, 228];
const SAFFRON = [232, 89, 12];

function sdRoundRect(px, py, cx, cy, hw, hh, r) {
	const dx = Math.abs(px - cx) - (hw - r);
	const dy = Math.abs(py - cy) - (hh - r);
	const ax = Math.max(dx, 0);
	const ay = Math.max(dy, 0);
	return Math.hypot(ax, ay) + Math.min(Math.max(dx, dy), 0) - r;
}

function sdCircle(px, py, cx, cy, r) {
	return Math.hypot(px - cx, py - cy) - r;
}

/** Coverage in [0,1] from an SDF. */
const cover = (sd) => Math.max(0, Math.min(1, 0.5 - sd));

function over(dst, src, a) {
	return [0, 1, 2].map((i) => Math.round(src[i] * a + dst[i] * (1 - a)));
}

function renderIcon(S) {
	const px = Buffer.alloc(S * S * 4);
	const SS = 3;
	for (let y = 0; y < S; y++) {
		for (let x = 0; x < S; x++) {
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			for (let sy = 0; sy < SS; sy++) {
				for (let sx = 0; sx < SS; sx++) {
					const fx = (x + (sx + 0.5) / SS) / S;
					const fy = (y + (sy + 0.5) / SS) / S;
					let col = [0, 0, 0];
					let al = 0;
					const push = (c, cov) => {
						col = over(col, c, cov);
						al = al + cov - al * cov;
					};
					// navy rounded background
					push(NAVY, cover(sdRoundRect(fx, fy, 0.5, 0.5, 0.5, 0.5, 0.22)));
					// back flashcard
					push(CREAM, cover(sdRoundRect(fx, fy, 0.46, 0.47, 0.32, 0.235, 0.1)));
					// front flashcard
					push(CREAM, cover(sdRoundRect(fx, fy, 0.56, 0.55, 0.32, 0.235, 0.1)));
					// saffron progress bar
					push(SAFFRON, cover(sdRoundRect(fx, fy, 0.56, 0.66, 0.24, 0.032, 0.032)));
					// saffron dot
					push(SAFFRON, cover(sdCircle(fx, fy, 0.84, 0.16, 0.075)));
					r += col[0] * al;
					g += col[1] * al;
					b += col[2] * al;
					a += al;
				}
			}
			const n = SS * SS;
			const i = (y * S + x) * 4;
			px[i] = Math.round(r / n);
			px[i + 1] = Math.round(g / n);
			px[i + 2] = Math.round(b / n);
			px[i + 3] = Math.round((a / n) * 255);
		}
	}
	return png(S, S, px);
}

for (const S of [192, 512]) {
	writeFileSync(join(OUT, `icon-${S}.png`), renderIcon(S));
	console.log(`static/icons/icon-${S}.png`);
}
