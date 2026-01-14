import type { RequestEvent } from '@sveltejs/kit';

/**
 * Get the KV namespace for login (same for staging and production)
 */
export function getLoginKV(event: RequestEvent): KVNamespace | null {
	const platform = event.platform;
	if (!platform?.env) {
		return null;
	}

	// Use STAGING_LOGIN for both staging and production
	return platform.env.STAGING_LOGIN || null;
}

/**
 * Get the KV namespace for posts (same for staging and production)
 */
export function getPostsKV(event: RequestEvent): KVNamespace | null {
	const platform = event.platform;
	if (!platform?.env) {
		return null;
	}

	// Use STAGING_POSTS for both staging and production
	return platform.env.STAGING_POSTS || null;
}
