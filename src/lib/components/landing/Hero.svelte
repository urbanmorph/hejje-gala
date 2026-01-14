<script lang="ts">
	import { onMount } from 'svelte';
	import { heroConfig } from '$lib/config/landing';
	import CountdownTimer from './CountdownTimer.svelte';
	import CTAButton from './CTAButton.svelte';
	import OrganizationLogos from './OrganizationLogos.svelte';
	import Header from './Header.svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		title?: string;
		showCountdown?: boolean;
		showCTA?: boolean;
		compact?: boolean;
		isMobile?: boolean;
		disabledLabels?: Set;
		postRegistration?: boolean;
	}

	let {
		title,
		showCountdown = true,
		showCTA = true,
		compact = false,
		isMobile = false,
		disabledLabels = new Set(['Leaderboard', 'Blog']),
		postRegistration = false
	}: Props = $props();

	const translatedTitle = $derived(title || $_('hero.title'));
	const translatedPoweredBy = $derived($_('hero.poweredBy'));

	type RegistrationStats = {
		companies: number;
		corporations: number;
	};

	let stats = $state(null);
	let statsError = $state(null);
	let statsLoading = $state(true);

	async function loadRegistrationStats() {
		try {
			statsLoading = true;
			statsError = null;

			const res = await fetch('https://assets.hejjegala.in/other/registration-stats.json');

			if (!res.ok) {
				throw new Error(`Failed to load registration stats (${res.status})`);
			}

			const data = (await res.json()) as {
				success: boolean;
				companies?: number;
				corporations?: number;
				error?: string;
			};

			if (
				!data.success ||
				typeof data.companies !== 'number' ||
				typeof data.corporations !== 'number'
			) {
				throw new Error(data.error || 'Invalid registration stats response');
			}

			stats = {
				companies: data.companies,
				corporations: data.corporations
			};
		} catch (err) {
			console.error('Error loading registration stats', err);
			statsError = err instanceof Error ? err.message : 'Failed to load registration stats';
			stats = null;
		} finally {
			statsLoading = false;
		}
	}

	onMount(() => {
		loadRegistrationStats();
	});

	const formatCount = (value: number | null | undefined) =>
		typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('en-IN') : '—';

	const bannerImage = $derived(compact ? '/assets/about-banner.png' : '/assets/landing-banner.png');
</script>

<Header {isMobile} {disabledLabels} />
<section
	class="hero-section relative {compact
		? 'h-90 lg:h-120'
		: isMobile
			? 'min-h-auto'
			: 'h-[73vh]'} overflow-hidden bg-[#FFFCF8] {isMobile && !compact
		? 'flex flex-col'
		: ''} {compact ? '' : 'compact'}"
	style="--banner-image: url('{bannerImage}')"
>
	<div
		class="relative z-10 mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-6 {compact
			? 'py-16'
			: isMobile
				? 'pt-12 pb-8'
				: 'pt-16 pb-8'} {isMobile && !compact ? 'flex-1' : ''} overflow-x-hidden"
	>
		<div class="text-center">
			<h1
				class="{compact
					? 'hidden mb-6 text-3xl'
					: isMobile
						? 'mb-12 text-2xl'
						: 'mb-16 text-2xl'} leading-tight font-bold text-white lg:text-6xl max-w-4xl mx-auto"
			>
				{translatedTitle}
			</h1>
			{#if showCountdown && !postRegistration}
				<div class={isMobile ? '' : 'mb-8'}>
					<CountdownTimer targetDate={heroConfig.countdownDate} />
				</div>
			{/if}
			{#if showCTA}
				<div class={isMobile ? 'mb-6 flex justify-center' : 'mb-12'}>
					{#if postRegistration}
						<CTAButton text={$_('common.viewLeaderboard')} variant="pink" href="/leaderboard" />
					{:else}
						<CTAButton text={$_('common.registerNow')} variant="pink" href="/register" />
					{/if}
				</div>
			{/if}
		</div>
	</div>
</section>

{#if !compact}
	{#if !isMobile}
		<!-- Powered By and10ogos row - Desktop: absolute positioned above blue section -->
		<div class=" z-20 transform w-[100%] max-w-full px-6">
			<div
				class="flex items-center gap-4 lg:gap-6 xl:gap-8 py-3 flex-wrap xl:flex-nowrap justify-center"
			>
				<p class="text-xl lg:text-2xl font-medium tracking-wider text-black whitespace-nowrap">
					{translatedPoweredBy}
				</p>
				<OrganizationLogos {isMobile} />
			</div>
		</div>
	{/if}

	{#if isMobile}
		<!-- Powered By and Logos row - Mobile: relative positioned above blue section over white background -->
		<div class="relative z-20 bg-[#FFFCF8] py-4 mt-auto">
			<div class="mx-auto max-w-[95%] px-6">
				<div class="flex flex-col items-center gap-3">
					<p class="text-base font-medium tracking-wider text-black">
						{translatedPoweredBy}
					</p>
					<OrganizationLogos {isMobile} />
				</div>
			</div>
		</div>
	{/if}

	<!-- Company and Corporation count - Full width blue background like Header -->
	<div class="relative mt-6 left-0 right-0 bg-[#0D6BA3] z-20">
		<div
			class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-6 {isMobile ? 'py-4' : 'py-3'}"
		>
			{#if postRegistration}
				<div class="flex justify-center">
					<span
						class="{isMobile
							? 'text-xl'
							: 'text-2xl'} font-bold text-white uppercase tracking-wider"
					>
						{$_('hero.challengeHasBegun')}
					</span>
				</div>
			{:else}
				<div class="flex justify-center {isMobile ? 'gap-8' : 'gap-20'}">
					<!-- Companies -->
					<div class="flex flex-col items-center">
						<span class="{isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white">
							{#if statsLoading}
								<span class="inline-block h-5 w-16 animate-pulse rounded bg-white/30"></span>
							{:else}
								{formatCount(stats?.companies)}
							{/if}
						</span>
						<span
							class="{isMobile
								? 'text-sm'
								: 'text-sm'} font-medium text-white uppercase tracking-wider mt-0.5"
						>
							{$_('welcome.companies')}
						</span>
					</div>
					<!-- Corporations -->
					<div class="flex flex-col items-center">
						<span class="{isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white">
							{#if statsLoading}
								<span class="inline-block h-5 w-16 animate-pulse rounded bg-white/30"></span>
							{:else}
								{formatCount(stats?.corporations)}
							{/if}
						</span>
						<span
							class="{isMobile
								? 'text-sm'
								: 'text-sm'} font-medium text-white uppercase tracking-wider mt-0.5"
						>
							{$_('welcome.corporations')}
						</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.hero-section::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image: var(--banner-image);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		z-index: 0;
	}

	/* Use cover below 1280px */
	@media (min-width: 1024px) and (max-width: 1279px) {
		.hero-section.compact::before {
			background-size: cover;
			transform-origin: center center;
			background-position: center center;
		}
	}
	/* Use contain at 1280px and above */
	@media (min-width: 1280px) {
		.hero-section.compact::before {
			background-size: contain;
			transform-origin: center center;
			background-repeat: no-repeat;
			background-position: center center;
			transform: scale(0.8);
		}
	}
</style>
