import type { RequestHandler } from '@sveltejs/kit';
import { getSession } from '$lib/utils/auth';

export const GET: RequestHandler = async (event) => {
	const session = await getSession(event);

	if (!session) {
		return new Response(
			JSON.stringify({
				authenticated: false
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json' }
			}
		);
	}

	return new Response(
		JSON.stringify({
			authenticated: true,
			email: session.email
		}),
		{
			status: 200,
			headers: { 'content-type': 'application/json' }
		}
	);
};
