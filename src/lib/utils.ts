import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Check if device is mobile (window width < 1280px, xl breakpoint)
 */
export function isMobile(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth < 1280;
}

/**
 * Check if device is desktop (window width >= 1280px, xl breakpoint)
 */
export function isDesktop(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth >= 1280;
}

export function parseCSV(text: string): string[][] {
	const rows: string[][] = [];
	let current = '';
	let inQuotes = false;
	let row: string[] = [];

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (inQuotes) {
			if (ch === '"' && text[i + 1] === '"') {
				current += '"';
				i++;
			} else if (ch === '"') {
				inQuotes = false;
			} else {
				current += ch;
			}
		} else if (ch === '"') {
			inQuotes = true;
		} else if (ch === ',') {
			row.push(current.trim());
			current = '';
		} else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
			row.push(current.trim());
			current = '';
			if (row.some((cell) => cell !== '')) rows.push(row);
			row = [];
			if (ch === '\r') i++;
		} else {
			current += ch;
		}
	}
	row.push(current.trim());
	if (row.some((cell) => cell !== '')) rows.push(row);
	return rows;
}
