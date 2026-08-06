import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import adapterNetlify from '@sveltejs/adapter-netlify';

// Platform-aware adapter: Vercel and Netlify set their own env vars at build
// time; anywhere else (local dev, the benchmark harness) we use adapter-node.
const adapter = process.env.VERCEL
	? adapterVercel()
	: process.env.NETLIFY || process.env.NETLIFY_BUILD
		? adapterNetlify()
		: adapterNode();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter
	}
};

export default config;
