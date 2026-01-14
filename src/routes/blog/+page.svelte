<script lang="ts">
	import Hero from '$lib/components/landing/Hero.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import type { BlogPost } from './+page.server';

	const BLOGS_URL = 'https://assets.hejjegala.in/blogs/index.json';

	let posts = $state([]);
	let postsLoading = $state(true);
	const user = $derived($page.data.user);

	// Load blog posts directly from R2 bucket
	async function loadPosts() {
		try {
			postsLoading = true;
			const response = await fetch(BLOGS_URL);
			if (!response.ok) {
				throw new Error('Failed to load posts');
			}

			const postsData: BlogPost[] = await response.json();
			// Sort by newest first
			posts = postsData.sort((a, b) => b.createdAt - a.createdAt);
		} catch (err) {
			console.error('Error loading posts:', err);
			posts = [];
		} finally {
			postsLoading = false;
		}
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

<svelte:head>
	<title>{$_('blog.pageTitle')}</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-[#FFFCF8]">
	<Hero
		title={$_('hero.blogTitle')}
		showCountdown={false}
		showCTA={false}
		compact={true}
		disabledLabels={new Set([])}
		postRegistration={true}
	/>

	<main class="flex-1 mt-12 sm:mt-16 mb-12 sm:mb-16">
		<div
			class="mx-auto max-w-[95%] sm:max-w-[90%] md:max-w-[80%] px-4 sm:px-6 space-y-6 sm:space-y-8"
		>
			{#if postsLoading}
				<div class="bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
					<p class="text-sm sm:text-base text-gray-600 mb-4">{$_('blog.loadingBlogPosts')}</p>
				</div>
			{:else if posts.length === 0}
				<div class="bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
					<p class="text-sm sm:text-base text-gray-600 mb-4">{$_('blog.noBlogPostsAvailable')}</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16">
					{#each posts as post (post.id)}
						<a
							href="/blog/{post.id}"
							class="bg-white rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm border border-gray-200 block"
						>
							<article>
								<!-- Banner Image -->
								<div class="w-full h-48 sm:h-56 md:h-64 bg-gray-200 overflow-hidden">
									<img
										src={post.bannerImage}
										alt={post.title}
										class="w-full h-full object-contain"
									/>
								</div>

								<div class="p-4 sm:p-6">
									<!-- Author -->
									<div class="flex items-center gap-2 mb-3">
										<div
											class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700"
										>
											{getInitials(post.authorName)}
										</div>
										<span class="text-xs sm:text-sm text-gray-700 font-medium"
											>{post.authorName}</span
										>
									</div>

									<!-- Title -->
									<h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
										{post.title}
									</h3>

									<!-- Subtitle -->
									<p class="text-xs sm:text-sm text-gray-600 line-clamp-2">
										{post.subtitle}
									</p>
								</div>
							</article>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</main>

	<Footer />
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
