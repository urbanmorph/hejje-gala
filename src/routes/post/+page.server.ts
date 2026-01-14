import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/utils/auth';

export const load: PageServerLoad = async (event) => {
	const session = await getSession(event);
	if (!session) {
		throw redirect(302, '/login');
	}
	return {
		user: session
	};
};
