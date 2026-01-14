import { i18nInit } from '$lib/i18n';
import type { LayoutLoad } from './$types';

// Ensure i18n is initialized before any page loads
export const load: LayoutLoad = async () => {
	await i18nInit;
	return {};
};
