<script lang="ts">
	import { slide } from 'svelte/transition';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { siteConfig, navigation } from '$lib/config/landing';
	import { locale, _ } from 'svelte-i18n';
	import { onMount } from 'svelte';

	interface Props {
		isMobile?: boolean;
		disabledLabels?: Set;
	}

	let { isMobile = false, disabledLabels = new Set([]) }: Props = $props();

	let mobileMenuOpen = $state(false);

	// Helper function to get translated navigation label
	function getNavLabel(label: string): string {
		const labelMap: Record = {
			Home: 'common.home',
			Leaderboard: 'common.leaderboard',
			Champions: 'common.champions',
			Events: 'common.events',
			'About Challenge': 'common.aboutChallenge',
			FAQs: 'common.faqs'
		};
		return labelMap[label] || label;
	}

	// Determine current page based on URL
	const currentPage = $derived.by(() => {
		const path = $page.url.pathname;
		const hash = $page.url.hash;
		if (path === '/about' && hash === '#faqs') return 'FAQs';
		if (path === '/about') return 'About Challenge';
		if (path === '/leaderboard') return 'Leaderboard';
		if (path === '/champions') return 'Champions';
		if (path === '/activities') return 'Events';
		return 'Home';
	});

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function toggleLanguage() {
		const current = $locale || 'en';
		const newLang = current === 'en' ? 'kn' : 'en';
		locale.set(newLang);
		// Save to localStorage
		if (typeof window !== 'undefined') {
			localStorage.setItem('locale', newLang);
		}
	}

	// Get current locale
	const currentLocale = $derived($locale);

	onMount(() => {
		// Load saved locale from localStorage
		if (typeof window !== 'undefined') {
			const savedLocale = localStorage.getItem('locale');
			if (savedLocale && (savedLocale === 'en' || savedLocale === 'kn')) {
				locale.set(savedLocale);
			}
		}
	});
</script>

<header class="sticky top-0 bg-[#0D6BA3] z-50 flex flex-col">
	<!-- Main header row -->
	<div class="flex items-center w-full {isMobile ? 'py-3' : 'py-4'}">
		<!-- Left spacer for desktop (matches right language toggle width) -->
		<div class="hidden lg:block flex-shrink-0"></div>

		<!-- Main header content with max-width constraint -->
		<div
			class="flex-1 flex items-center justify-between lg:max-w-[85%] xl:max-w-[80%] mx-auto px-6 lg:px-0"
		>
			<!-- Left: Logo -->
			<div class="flex-shrink-0">
				<img
					src="/assets/logo.png"
					alt="{siteConfig.name} Logo"
					class="h-10 lg:h-11 w-auto object-contain"
				/>
			</div>

			<!-- Center: Navigation (Desktop) -->
			<div class="hidden lg:flex items-center justify-center flex-1">
				<nav class="flex items-center justify-center gap-6 xl:gap-8">
					{#each navigation as link}
						{#if disabledLabels.has(link.label)}
							<span
								class="relative cursor-not-allowed pb-1 text-base font-medium whitespace-nowrap text-white/70"
								aria-disabled="true"
							>
								{$_(getNavLabel(link.label))}
							</span>
						{:else}
							<a
								href={link.label === 'Home' ? base || '/' : link.href}
								class="group relative pb-1 text-base font-medium whitespace-nowrap transition-colors hover:text-gray-200 text-white"
							>
								{$_(getNavLabel(link.label))}
								<span
									class="absolute bottom-0 left-0 h-0.5 bg-[#EFBC4A] rounded-full transition-all duration-300 ease-out {link.label ===
									currentPage
										? 'w-3'
										: 'w-0 group-hover:w-3'}"
								></span>
							</a>
						{/if}
					{/each}
				</nav>
			</div>

			<!-- Language Toggle Button (Mobile - below lg) -->
			<button
				type="button"
				onclick={toggleLanguage}
				class="flex lg:hidden items-center justify-center px-2 h-10 rounded-lg text-white text-sm font-semibold transition-colors hover:bg-white/20 whitespace-nowrap flex-shrink-0"
				aria-label={$_('header.toggleLanguage')}
			>
				English | ಕನ್ನಡ
			</button>

			<!-- Hamburger Menu Button (Mobile - below lg) -->
			<button
				type="button"
				onclick={toggleMobileMenu}
				class="flex lg:hidden flex-col items-center justify-center gap-1.5 p-2 flex-shrink-0"
				aria-label={$_('header.toggleMenu')}
				aria-expanded={mobileMenuOpen}
			>
				<span
					class="block h-0.5 w-6 transition-all duration-300 bg-white {mobileMenuOpen
						? 'translate-y-2 rotate-45'
						: ''}"
				></span>
				<span
					class="block h-0.5 w-6 transition-all duration-300 bg-white {mobileMenuOpen
						? 'opacity-0'
						: ''}"
				></span>
				<span
					class="block h-0.5 w-6 transition-all duration-300 bg-white {mobileMenuOpen
						? '-translate-y-2 -rotate-45'
						: ''}"
				></span>
			</button>
		</div>

		<!-- Right: Language Toggle (Desktop - lg and above) - At extreme right -->
		<div class="hidden lg:flex items-center justify-end w-[140px] flex-shrink-0 pr-4 xl:pr-6">
			<button
				type="button"
				onclick={toggleLanguage}
				class="flex items-center justify-center px-3 h-9 xl:h-10 rounded-lg text-white text-sm font-semibold transition-colors hover:bg-white/20 whitespace-nowrap"
				aria-label={$_('header.toggleLanguage')}
			>
				English | ಕನ್ನಡ
			</button>
		</div>
	</div>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="bg-black/95 backdrop-blur-sm lg:hidden" transition:slide={{ duration: 200 }}>
			<nav class="flex flex-col px-6 py-6 space-y-4">
				{#each navigation as link}
					{#if disabledLabels.has(link.label)}
						<span
							class="cursor-not-allowed text-base font-medium text-white/70"
							aria-disabled="true"
						>
							{$_(getNavLabel(link.label))}
						</span>
					{:else}
						<a
							href={link.label === 'Home' ? base || '/' : link.href}
							onclick={closeMobileMenu}
							class="text-base font-medium transition-colors hover:text-gray-200 {link.label ===
							currentPage
								? 'text-[#EFBC4A]'
								: 'text-white'}"
						>
							{$_(getNavLabel(link.label))}
						</a>
					{/if}
				{/each}
			</nav>
		</div>
	{/if}
</header>
