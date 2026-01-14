/**
 * Google Maps Places API utility functions
 */

interface GoogleMapsInitOptions {
	apiKey?: string;
	libraries?: string[];
}

interface GoogleMapsInitResult {
	PlaceAutocomplete: any;
	isInitialized: boolean;
	error?: string;
}

// Singleton promise to prevent multiple concurrent initializations
let initializationPromise: Promise<GoogleMapsInitResult> | null = null;

/**
 * Wait for Google Maps API to be available
 */
function waitForGoogleMaps(
	maxWaitTime: number = 10000,
	checkInterval: number = 100
): Promise<void> {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();

		const check = () => {
			const googleMaps = (window as any).google;

			if (googleMaps?.maps?.places) {
				resolve();
				return;
			}

			if (Date.now() - startTime >= maxWaitTime) {
				const error = googleMaps?.maps
					? 'Places API is not available. Please ensure the Places API (New) is enabled in your Google Cloud Console.'
					: 'Google Maps JavaScript API failed to load. Please check your API key and ensure the Maps JavaScript API is enabled.';
				reject(new Error(error));
				return;
			}

			setTimeout(check, checkInterval);
		};

		check();
	});
}

/**
 * Initialize Google Maps Places API
 */
export async function initializeGoogleMaps(
	options: GoogleMapsInitOptions
): Promise<GoogleMapsInitResult> {
	// Check if Google Maps is already initialized
	if (typeof window !== 'undefined') {
		const googleMaps = (window as any).google;
		if (googleMaps?.maps?.places) {
			// Already initialized, just return the PlaceAutocomplete component
			const placesModule = await import('places-autocomplete-svelte');
			return {
				PlaceAutocomplete: placesModule.PlaceAutocomplete,
				isInitialized: true
			};
		}
	}

	// If initialization is already in progress, return the existing promise
	if (initializationPromise) {
		return initializationPromise;
	}

	// Start new initialization
	initializationPromise = (async (): Promise<GoogleMapsInitResult> => {
		try {
			// Import required modules
			const [placesModule, gmapsModule, envModule] = await Promise.all([
				import('places-autocomplete-svelte'),
				import('places-autocomplete-svelte/gmaps'),
				import('$env/static/public')
			]);

			const apiKey = options.apiKey || envModule.PUBLIC_GOOGLE_MAPS_API_KEY;

			if (!apiKey?.trim()) {
				throw new Error('Google Maps API key is required. Please provide a valid API key.');
			}

			// Initialize Google Maps
			await gmapsModule.initialiseGMapsNoContext({
				key: apiKey,
				libraries: options.libraries || ['places']
			});

			// Wait for Places API to be available
			await waitForGoogleMaps();

			const result = {
				PlaceAutocomplete: placesModule.PlaceAutocomplete,
				isInitialized: true
			};
			// Keep promise cached on success so concurrent calls get the same result
			return result;
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to initialize Google Maps. Please refresh the page.';

			const result = {
				PlaceAutocomplete: null,
				isInitialized: false,
				error: errorMessage
			};
			// Clear promise on failure to allow retry
			initializationPromise = null;
			return result;
		}
	})();

	return initializationPromise;
}
