// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface R2Bucket {
		get(key: string): Promise<R2ObjectBody | null>;
		// Cloudflare's actual R2 put return shape is rich; keep this loose so callers
		// that read uploaded/version/customMetadata still typecheck.
		put(
			key: string,
			value: ArrayBuffer | ArrayBufferView | string | ReadableStream,
			options?: { httpMetadata?: { contentType?: string } }
		): Promise<Record<string, unknown> & { key: string; etag: string; size: number }>;
		delete(key: string): Promise<void>;
	}
	interface R2ObjectBody {
		text(): Promise<string>;
		json<T = unknown>(): Promise<T>;
		arrayBuffer(): Promise<ArrayBuffer>;
	}
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
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
