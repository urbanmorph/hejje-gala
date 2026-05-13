import { error } from '@sveltejs/kit';
import { isValidAdminToken } from '$lib/server/events';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, setHeaders }) => {
	if (!isValidAdminToken(params.token)) {
		throw error(404, 'Not found');
	}

	setHeaders({
		'cache-control': 'no-store',
		'x-robots-tag': 'noindex, nofollow'
	});

	return { token: params.token };
};
