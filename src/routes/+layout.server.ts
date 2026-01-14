import { getSession } from '$lib/utils/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const session = await getSession(event);
	return {
		user: session
	};
};
