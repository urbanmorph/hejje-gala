import type { RequestEvent } from '@sveltejs/kit';
import { getLoginKV } from './kv';

export async function getSession(event: RequestEvent): Promise<{ email: string } | null> {
	const sessionToken = event.cookies.get('auth_session');

	if (!sessionToken) {
		return null;
	}

	const loginKV = getLoginKV(event);
	if (!loginKV) {
		return null;
	}

	try {
		const sessionData = await loginKV.get(`session:${sessionToken}`, 'json');
		if (!sessionData) {
			return null;
		}

		return sessionData as { email: string };
	} catch (error) {
		console.error('Error getting session:', error);
		return null;
	}
}

export async function requireAuth(event: RequestEvent): Promise<{ email: string }> {
	const session = await getSession(event);
	if (!session) {
		throw new Error('Unauthorized');
	}
	return session;
}
