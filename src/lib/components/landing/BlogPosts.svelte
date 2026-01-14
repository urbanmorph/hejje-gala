<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';

	type BlogPost = {
		id: string;
		title: string;
		subtitle: string;
		authorName: string;
		authorCompany: string;
		bannerImage: string;
		body: string;
		createdAt: number;
	};

	interface Props {
		corporationId?: string | null;
		companyId?: string | null;
		limit?: number;
		isMobile?: boolean;
	}

	let { corporationId = null, companyId = null, limit = 6, isMobile = false }: Props = $props();

	const BLOGS_URL = 'https://assets.hejjegala.in/blogs/index.json';

	let posts = $state([]);
	let postsLoading = $state(true);

	// Load blog posts directly from R2 bucket
	async function loadPosts() {
		try {
			postsLoading = true;
			const response = await fetch(BLOGS_URL);
			if (!response.ok) {
				throw new Error('Failed to load posts');
			}

			const postsData: BlogPost[] = await response.json();
			// Sort by newest first and take first N posts
			posts = postsData.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
		} catch (err) {
			console.error('Error loading posts:', err);
			posts = [];
		} finally {
			postsLoading = false;
		}
	}

	function formatTimeAgo(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return '1d ago';
		return `${days}d ago`;
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	// Load posts when component mounts
	$effect(() => {
		loadPosts();
	});
</script>

{#if !postsLoading && posts.length > 0}
	<section class="bg-[#FFFCF8] {isMobile ? 'py-8' : 'py-16'}">
		<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-7xl'} px-6">
			<h2
				class="{isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 {isMobile
					? 'mb-6'
					: 'mb-12'} text-center"
			>
				{$_('blog.recommendedStories')}
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 {isMobile ? 'gap-4' : 'gap-8'}">
				{#each posts as post (post.id)}
					<a
						href="/blog/{post.id}"
						class="bg-white rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity block"
					>
						<article>
							<!-- Banner Image -->
							<div class="w-full {isMobile ? 'h-32' : 'h-48'} bg-gray-200 overflow-hidden">
								<img src={post.bannerImage} alt={post.title} class="w-full h-full object-contain" />
							</div>

							<div class={isMobile ? 'p-4' : 'p-6'}>
								<!-- Author -->
								<div class="flex items-center gap-2 {isMobile ? 'mb-2' : 'mb-3'}">
									<div
										class="{isMobile
											? 'w-6 h-6'
											: 'w-8 h-8'} rounded-full bg-gray-300 flex items-center justify-center {isMobile
											? 'text-[10px]'
											: 'text-xs'} font-medium text-gray-700"
									>
										{getInitials(post.authorName)}
									</div>
									<span class="{isMobile ? 'text-xs' : 'text-sm'} text-gray-700 font-medium"
										>{post.authorName}</span
									>
								</div>

								<!-- Title -->
								<h3
									class="{isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-900 {isMobile
										? 'mb-1'
										: 'mb-2'} line-clamp-2"
								>
									{post.title}
								</h3>

								<!-- Subtitle -->
								<p
									class="{isMobile ? 'text-xs' : 'text-sm'} text-gray-600 {isMobile
										? 'mb-2'
										: 'mb-4'} line-clamp-2"
								>
									{post.subtitle}
								</p>
							</div>
						</article>
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
