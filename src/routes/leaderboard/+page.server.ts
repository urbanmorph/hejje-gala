import type { RequestEvent } from '@sveltejs/kit';
import { getPostsKV } from '$lib/utils/kv';

type Post = {
	id: string;
	content: string;
	email: string;
	createdAt: number;
	corporationId?: string;
	companyId?: string;
};

export const load = async (event: RequestEvent) => {
	const postsKV = getPostsKV(event);

	if (!postsKV) {
		return {
			posts: [] as Post[]
		};
	}

	try {
		// Get list of post IDs
		const postsList = (await postsKV.get('posts:list', 'json')) as string[] | null;

		if (!postsList || postsList.length === 0) {
			return {
				posts: [] as Post[]
			};
		}

		// Fetch all posts
		const postPromises = postsList.map((postId: string) => postsKV.get(`post:${postId}`, 'json'));
		const postsData = await Promise.all(postPromises);

		// Filter out null values and type the posts
		const posts = postsData
			.filter(
				(post: unknown): post is Post =>
					post !== null &&
					typeof post === 'object' &&
					'id' in post &&
					'content' in post &&
					'email' in post &&
					'createdAt' in post
			)
			.sort((a: Post, b: Post) => b.createdAt - a.createdAt); // Sort by newest first

		return {
			posts
		};
	} catch (error) {
		console.error('Error loading posts:', error);
		return {
			posts: [] as Post[]
		};
	}
};
