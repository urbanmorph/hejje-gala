import { register, init, getLocaleFromNavigator, waitLocale } from 'svelte-i18n';

register('en', () => import('./locales/en.json'));
register('kn', () => import('./locales/kn.json'));

function getInitialLocale(): string {
	// Check localStorage first (browser only)
	if (typeof window !== 'undefined') {
		const savedLocale = localStorage.getItem('locale');
		if (savedLocale === 'en' || savedLocale === 'kn') {
			return savedLocale;
		}

		// Fall back to navigator locale (browser only)
		try {
			const navLocale = getLocaleFromNavigator();
			if (navLocale && navLocale.split('-')[0] === 'kn') {
				return 'kn';
			}
		} catch (e) {
			// Ignore errors in SSR or if getLocaleFromNavigator fails
		}
	}

	// Default to English (works for both SSR and client)
	return 'en';
}

const initialLocale = getInitialLocale();

// Initialize i18n and wait for both init and locale loading
export const i18nInit = (async () => {
	await init({
		fallbackLocale: 'en',
		initialLocale
	});
	await waitLocale(initialLocale);
})();
