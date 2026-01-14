import type { RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/utils/auth';
import { getPostsKV } from '$lib/utils/kv';

export const POST: RequestHandler = async (event) => {
	try {
		// Check authentication
		const session = await requireAuth(event);

		const body = (await event.request.json()) as {
			content: string;
			corporationId?: string;
			companyId?: string;
		};
		const { content } = body;

		if (!content || content.trim() === '') {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Content is required'
				}),
				{
					status: 400,
					headers: { 'content-type': 'application/json' }
				}
			);
		}

		const postsKV = getPostsKV(event);
		if (!postsKV) {
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

		// Create post object
		const postId = crypto.randomUUID();
		const { corporationId, companyId } = body;
		const post = {
			id: postId,
			content,
			email: session.email,
			createdAt: Date.now(),
			...(corporationId && { corporationId }),
			...(companyId && { companyId })
		};

		// Save post to KV
		await postsKV.put(`post:${postId}`, JSON.stringify(post));

		// Also add to a list of all posts (for potential future listing)
		const postsList = (await postsKV.get('posts:list', 'json')) || [];
		(postsList as string[]).push(postId);
		await postsKV.put('posts:list', JSON.stringify(postsList));

		return new Response(
			JSON.stringify({
				success: true,
				postId
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json' }
			}
		);
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Unauthorized'
				}),
				{
					status: 401,
					headers: { 'content-type': 'application/json' }
				}
			);
		}

		console.error('Error saving post:', error);
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

const BLOGS_URL = 'https://assets.hejjegala.in/blogs/index.json';

export const GET: RequestHandler = async () => {
	try {
		const response = await fetch(BLOGS_URL);
		if (!response.ok) {
			throw new Error(`Failed to fetch blogs: ${response.status}`);
		}

		const posts = await response.json();

		// Sort by newest first
		const sortedPosts = posts.sort((a: any, b: any) => b.createdAt - a.createdAt);

		return new Response(
			JSON.stringify({
				success: true,
				posts: sortedPosts
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('Error fetching posts:', error);
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
