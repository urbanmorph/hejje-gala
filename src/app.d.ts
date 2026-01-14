// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				email: string;
			};
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				LOGIN_KV?: KVNamespace;
				POSTS_KV?: KVNamespace;
				STAGING_LOGIN?: KVNamespace;
				STAGING_POSTS?: KVNamespace;
				GALA_ASSETS?: R2Bucket;
			};
		}
	}
}

declare module '$env/static/private' {
	export const ALTMO_DOMAIN: string;
	export const ALTMO_API_KEY: string;
	export const ALTMO_CHALLENGE_ID: string;
	export const ALTMO_CITY_ID: string;
	export const MAILGUN_API_KEY: string;
	export const MAILGUN_DOMAIN: string;
	export const MAILGUN_FROM_EMAIL: string;
	export const SITE_URL: string;
}

declare module '$env/static/public' {
	export const PUBLIC_GOOGLE_MAPS_API_KEY: string;
}

// Google Maps type declarations
declare global {
	interface Window {
		google?: {
			maps?: {
				places?: {
					Autocomplete: new (
						inputField: HTMLInputElement,
						options?: any
					) => {
						getPlace: () => any;
						addListener: (event: string, callback: () => void) => void;
					};
				};
			};
		};
	}
}

export {};
