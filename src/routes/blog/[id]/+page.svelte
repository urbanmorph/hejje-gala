<script lang="ts">
	import Hero from '$lib/components/landing/Hero.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { BlogPost } from './+page.server';

	let { data }: { data: PageData } = $props();

	const post: BlogPost = data.post;

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<svelte:head>
	<title>{post.title} - {$_('blog.pageTitle')}</title>
	<meta name="description" content={post.subtitle} />
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
		<div class="mx-auto max-w-[95%] sm:max-w-[90%] md:max-w-4xl px-4 sm:px-6">
			<!-- Back Button -->
			<button
				onclick={() => goto('/blog')}
				class="mb-6 sm:mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
			>
				<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				<span class="font-medium">{$_('blog.backToBlog')}</span>
			</button>

			<!-- Blog Post Content -->
			<article class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<!-- Banner Image -->
				<div class="w-full h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-200 overflow-hidden">
					<img src={post.bannerImage} alt={post.title} class="w-full h-full object-cover" />
				</div>

				<div class="p-4 sm:p-6 md:p-8 lg:p-12">
					<!-- Author Info -->
					<div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
						<div
							class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-xs sm:text-sm font-medium text-gray-700"
						>
							{getInitials(post.authorName)}
						</div>
						<div class="flex flex-col">
							<span class="text-sm sm:text-base text-gray-900 font-semibold">{post.authorName}</span
							>
							<span class="text-xs sm:text-sm text-gray-600">{post.authorCompany}</span>
						</div>
					</div>

					<!-- Date -->
					<div class="mb-4 sm:mb-6">
						<time class="text-xs sm:text-sm text-gray-500">
							{formatDate(post.createdAt)}
						</time>
					</div>

					<!-- Title -->
					<h1
						class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight"
					>
						{post.title}
					</h1>

					<!-- Subtitle -->
					<p class="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
						{post.subtitle}
					</p>

					<!-- Divider -->
					<div class="border-t border-gray-200 mb-6 sm:mb-8"></div>

					<!-- Body Content -->
					<div class="prose prose-sm sm:prose-base md:prose-lg max-w-none">
						{@html post.body}
					</div>
				</div>
			</article>
		</div>
	</main>

	<Footer />
</div>

<style>
	:global(.prose) {
		color: #374151;
		line-height: 1.75;
	}

	:global(.prose p) {
		margin-top: 1em;
		margin-bottom: 1em;
	}

	@media (min-width: 640px) {
		:global(.prose p) {
			margin-top: 1.25em;
			margin-bottom: 1.25em;
		}
	}

	:global(.prose p:first-child) {
		margin-top: 0;
	}

	:global(.prose p:last-child) {
		margin-bottom: 0;
	}

	:global(.prose h2) {
		font-size: 1.25em;
		font-weight: 700;
		margin-top: 1.5em;
		margin-bottom: 0.75em;
		color: #111827;
	}

	@media (min-width: 640px) {
		:global(.prose h2) {
			font-size: 1.5em;
			margin-top: 2em;
			margin-bottom: 1em;
		}
	}

	:global(.prose h3) {
		font-size: 1.125em;
		font-weight: 600;
		margin-top: 1.25em;
		margin-bottom: 0.5em;
		color: #111827;
	}

	@media (min-width: 640px) {
		:global(.prose h3) {
			font-size: 1.25em;
			margin-top: 1.5em;
			margin-bottom: 0.75em;
		}
	}

	:global(.prose strong) {
		font-weight: 600;
		color: #111827;
	}

	:global(.prose em) {
		font-style: italic;
	}

	:global(.prose a) {
		color: #0d6ba3;
		text-decoration: underline;
		word-break: break-word;
	}

	:global(.prose a:hover) {
		color: #0a5480;
	}

	:global(.prose ul),
	:global(.prose ol) {
		margin-top: 1em;
		margin-bottom: 1em;
		padding-left: 1.25em;
	}

	@media (min-width: 640px) {
		:global(.prose ul),
		:global(.prose ol) {
			margin-top: 1.25em;
			margin-bottom: 1.25em;
			padding-left: 1.625em;
		}
	}

	:global(.prose li) {
		margin-top: 0.5em;
		margin-bottom: 0.5em;
	}

	:global(.prose img) {
		margin-top: 1.5em;
		margin-bottom: 1.5em;
		border-radius: 0.5rem;
		max-width: 100%;
		height: auto;
	}

	@media (min-width: 640px) {
		:global(.prose img) {
			margin-top: 2em;
			margin-bottom: 2em;
		}
	}
</style>
