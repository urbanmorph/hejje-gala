<script lang="ts">
	/* Based on https://github.com/silinternational/svelte-google-places-autocomplete */

	import { createEventDispatcher, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

	interface PlaceResult {
		place_id: string;
		geometry?: {
			location: {
				lat: () => number;
				lng: () => number;
			};
		};
		formatted_address?: string;
		[name: string]: any;
	}

	interface PlaceData {
		place: PlaceResult;
		text: string;
	}

	interface AutocompleteOptions {
		bounds?: {
			south: number;
			north: number;
			west: number;
			east: number;
		};
		fields?: string[];
		strictBounds?: boolean;
		[ key: string ]: any;
	}

	let {
		apiKey = $bindable(PUBLIC_GOOGLE_MAPS_API_KEY),
		options = $bindable<AutocompleteOptions | undefined>(undefined),
		placeholder = $bindable<string | undefined>(undefined),
		value = $bindable(''),
		required = $bindable(false),
		pattern = $bindable<string | undefined>(undefined),
		inputField = $bindable<HTMLInputElement | null>(null),
		className = $bindable('')
	}: {
		apiKey?: string;
		options?: AutocompleteOptions;
		placeholder?: string;
		value?: string;
		required?: boolean;
		pattern?: string;
		inputField?: HTMLInputElement | null;
		className?: string;
	} = $props();

	const dispatch = createEventDispatcher<{
		ready: void;
		place_changed: PlaceData;
	}>();

	let selectedLocationName = $state(value || '');

	onMount(() => {
		if (!browser) return;

		loadGooglePlacesLibrary(apiKey, () => {
			if (!inputField) return;
			const googleMaps = (window as any).google;
			if (!googleMaps?.maps?.places) return;

			const autocomplete = new googleMaps.maps.places.Autocomplete(inputField, options);

			autocomplete.addListener('place_changed', () => {
				const place = autocomplete.getPlace();

				// There are circumstances where the place_changed event fires, but we
				// were NOT given location data. I only want to propagate the event if we
				// truly received location data from Google.
				// See the `Type something, no suggestions, hit Enter` test case.
				if (hasLocationData(place) && inputField) {
					setSelectedLocation({
						place: place,
						text: inputField.value
					});
				}
			});

			dispatch('ready');
		});
	});

	function emptyLocationField() {
		if (inputField) {
			inputField.value = '';
			onChange();
		}
	}

	function hasLocationData(place: PlaceResult): boolean {
		const fieldsToLookFor =
			(options && options.fields?.indexOf('ALL') === -1 && options.fields) || ['geometry'];
		return place.hasOwnProperty(fieldsToLookFor[0]);
	}

	function onChange() {
		if (inputField && inputField.value === '') {
			setSelectedLocation(null);
		}
	}

	function onKeyDown(event: KeyboardEvent) {
		const suggestionsAreVisible = document.getElementsByClassName('pac-item').length;

		if (event.key === 'Enter' || event.key === 'Tab') {
			if (suggestionsAreVisible) {
				const isSuggestionSelected = document.getElementsByClassName('pac-item-selected').length;
				if (!isSuggestionSelected) {
					selectFirstSuggestion();
				}
			} else if (inputField && doesNotMatchSelectedLocation(inputField.value)) {
				setTimeout(emptyLocationField, 10);
			}
		} else if (event.key === 'Escape') {
			setTimeout(emptyLocationField, 10);
		}

		if (suggestionsAreVisible) {
			if (event.key === 'Enter') {
				/* When suggestions are visible, don't let an 'Enter' submit a form (since
				 * the user is interacting with the list of suggestions at the time, not
				 * expecting their actions to affect the form as a whole). */
				event.preventDefault();
			}
		}
	}

	function selectFirstSuggestion() {
		if (!inputField) return;
		// Simulate the 'down arrow' key in order to select the first suggestion:
		// https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
		const simulatedEvent = new KeyboardEvent('keydown', {
			key: 'ArrowDown',
			code: 'ArrowDown',
			keyCode: 40
		});
		inputField.dispatchEvent(simulatedEvent);
	}

	function setSelectedLocation(data: PlaceData | null) {
		selectedLocationName = data && data.text ? data.text : '';
		if (data) {
			dispatch('place_changed', data);
		}
	}

	function doesNotMatchSelectedLocation(value: string): boolean {
		return selectedLocationName !== value;
	}

	let isLoadingLibrary = false;

	/**
	 * The list of callbacks, one from each GooglePlacesAutocomplete instance that requested the library before the library
	 * had finished loading.
	 */
	const callbacks: Array<() => void> = [];

	function hasLoadedLibrary(): boolean {
		return !!(window as any).google?.maps?.places;
	}

	/**
	 * Load the Google Places library and notify the calling code (if given a callback) once the library is ready.
	 *
	 * This supports three scenarios:
	 * 1. The library hasn't been loaded yet and isn't in the process of loading yet.
	 * 2. The library hasn't been loaded yet but is already in the process of loading.
	 * 3. The library has already been loaded.
	 *
	 * In scenarios 1 and 2, any callbacks that have been provided (which could be multiple, if multiple
	 * GooglePlacesAutocomplete instances are in use) will be called when the library finishes loading.
	 *
	 * In scenario 3, the callback will be called immediately.
	 *
	 * @param apiKey Your Google Places API Key
	 * @param callback A callback (if you want to be notified when the library is available for use)
	 */
	export function loadGooglePlacesLibrary(apiKey: string, callback?: () => void): void {
		if (!browser) return;

		if (hasLoadedLibrary()) {
			callback?.();
			return;
		}

		if (callback) {
			callbacks.push(callback);
		}

		if (isLoadingLibrary) {
			return;
		}

		isLoadingLibrary = true;

		const element = document.createElement('script');
		element.async = true;
		element.defer = true;
		element.onload = onLibraryLoaded;
		element.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
			apiKey
		)}&libraries=places&callback=Function.prototype`;
		element.type = 'text/javascript';

		document.head.appendChild(element);
	}

	function onLibraryLoaded() {
		isLoadingLibrary = false;
		let callback: (() => void) | undefined;
		while ((callback = callbacks.pop())) {
			callback();
		}
	}
</script>

<input
	bind:this={inputField}
	class={className}
	onchange={onChange}
	onkeydown={onKeyDown}
	{placeholder}
	bind:value
	{required}
	{pattern}
/>
