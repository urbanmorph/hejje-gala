import type { RequestHandler } from '@sveltejs/kit';
import { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL, SITE_URL } from '$env/static/private';
import { getLoginKV } from '$lib/utils/kv';

export const POST: RequestHandler = async (event) => {
	const { request, platform } = event;
	try {
		const { email } = (await request.json()) as { email: string };

		if (!email || !email.includes('@')) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Invalid email address'
				}),
				{
					status: 400,
					headers: { 'content-type': 'application/json' }
				}
			);
		}

		// Generate a secure random token
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		const token = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
		const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes from now

		// Store token in Cloudflare KV
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

		await loginKV.put(`token:${token}`, JSON.stringify({ email, expiresAt }), {
			expirationTtl: 900 // 15 minutes in seconds
		});

		// Send email via Mailgun
		const loginUrl = `${SITE_URL}/login/verify?token=${token}`;
		const textBody = `Click the following link to log in:\n\n${loginUrl}\n\nThis link will expire in 15 minutes.`;
		const htmlBody = `<p>Click the following link to log in:</p><p><a href="${loginUrl}">${loginUrl}</a></p><p>This link will expire in 15 minutes.</p>`;

		// Console log the email body
		console.log('=== Email Details ===');
		console.log('From:', MAILGUN_FROM_EMAIL);
		console.log('To:', email);
		console.log('Subject: Your Login Link');
		console.log('Text Body:', textBody);
		console.log('HTML Body:', htmlBody);
		console.log('Login URL:', loginUrl);
		console.log('===================');

		const formData = new FormData();
		formData.append('from', MAILGUN_FROM_EMAIL);
		formData.append('to', email);
		formData.append('subject', 'Your Login Link');
		formData.append('text', textBody);
		formData.append('html', htmlBody);

		// Encode credentials for Basic auth (Cloudflare Workers compatible)
		const credentials = `api:${MAILGUN_API_KEY}`;
		const encodedCredentials = btoa(credentials);

		const mailgunResponse = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${encodedCredentials}`
			},
			body: formData
		});

		if (!mailgunResponse.ok) {
			const errorText = await mailgunResponse.text();
			console.error('Mailgun error:', errorText);
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Failed to send email'
				}),
				{
					status: 500,
					headers: { 'content-type': 'application/json' }
				}
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Login email sent'
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('Error in login request:', error);
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
