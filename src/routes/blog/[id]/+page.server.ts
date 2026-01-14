import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export type BlogPost = {
	id: string;
	title: string;
	subtitle: string;
	authorName: string;
	authorCompany: string;
	bannerImage: string;
	body: string;
	createdAt: number;
};

export const load: PageServerLoad = async ({ params }) => {
	const BLOGS_URL = 'https://assets.hejjegala.in/blogs/index.json';

	try {
		const response = await fetch(BLOGS_URL);
		if (!response.ok) {
			throw new Error('Failed to load posts');
		}

		const postsData: BlogPost[] = await response.json();
		const post = postsData.find((p) => p.id === params.id);

		if (!post) {
			throw error(404, 'Blog post not found');
		}

		return {
			post
		};
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load blog post');
	}
};
