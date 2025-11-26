/**
 * Utility functions for the application
 */

/**
 * Format number with commas (e.g., 1000000 -> 1,000,000)
 */
export function formatNumber(num: number): string {
	return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Calculate time remaining until a target date
 */
export function getTimeRemaining(targetDate: Date) {
	const now = new Date().getTime();
	const target = targetDate.getTime();
	const difference = target - now;

	if (difference <= 0) {
		return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
	}

	const days = Math.floor(difference / (1000 * 60 * 60 * 24));
	const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((difference % (1000 * 60)) / 1000);

	return { days, hours, minutes, seconds, isExpired: false };
}

/**
 * Smooth scroll to element
 */
export function smoothScrollTo(elementId: string) {
	const element = document.getElementById(elementId);
	if (element) {
		element.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(date);
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
	if (text.length <= length) return text;
	return text.substring(0, length) + '...';
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
	const rect = element.getBoundingClientRect();
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}
