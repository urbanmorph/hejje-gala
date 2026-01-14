import type { RequestHandler } from '@sveltejs/kit';
import { getLoginKV } from '$lib/utils/kv';

export const GET: RequestHandler = async (event) => {
	const { url, platform, cookies } = event;
	try {
		const token = url.searchParams.get('token');

		if (!token) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'No token provided'
				}),
				{
					status: 400,
					headers: { 'content-type': 'application/json' }
				}
			);
		}

		const loginKV = getLoginKV(event);
		if (!loginKV) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'KV store not configured'
				}),
				{
					status: 500,
					headers: { 'content-type': 'application/json' }
				}
			);
		}

		// Get token data from KV
		const tokenData = await loginKV.get(`token:${token}`, 'json');

		if (!tokenData) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Invalid or expired token'
				}),
				{
					status: 401,
					headers: { 'content-type': 'application/json' }
				}
			);
		}

		const { email, expiresAt } = tokenData as { email: string; expiresAt: number };

		// Check if token has expired
		if (Date.now() > expiresAt) {
			// Delete expired token
			await loginKV.delete(`token:${token}`);
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Token has expired'
				}),
				{
					status: 401,
					headers: { 'content-type': 'application/json' }
				}
			);
		}

		// Delete the token after use (one-time use)
		await loginKV.delete(`token:${token}`);

		// Set authentication cookie
		const sessionToken = crypto.randomUUID();
		const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

		cookies.set('auth_session', sessionToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			expires: sessionExpires
		});

		// Store session in KV
		await loginKV.put(`session:${sessionToken}`, JSON.stringify({ email, createdAt: Date.now() }), {
			expirationTtl: 30 * 24 * 60 * 60 // 30 days in seconds
		});

		return new Response(
			JSON.stringify({
				success: true,
				email
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('Error in login verify:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'An unexpected error occurred'
			}),
			{
				status: 500,
				headers: { 'content-type': 'application/json' }
			}
		);
	}
};
