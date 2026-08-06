import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { HTMLAttributes } from 'svelte/elements';

/** shadcn-svelte style class combiner. */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Ref typing for shadcn-svelte components. */
export type WithElementRef<T> = T & {
	ref?: HTMLAttributes<HTMLElement>['ref'];
};
