<script lang="ts">
	import { onMount } from 'svelte';
	import { heroConfig } from '$lib/config/landing';
	import { urls } from '$lib/config/urls';
	import CTAButton from './CTAButton.svelte';
	import OrganizationLogos from './OrganizationLogos.svelte';
	import Header from './Header.svelte';
	import { _ } from 'svelte-i18n';
	import type { EventsData } from '$lib/types/event';

	interface Props {
		title?: string;
		showCTA?: boolean;
		compact?: boolean;
		isMobile?: boolean;
		disabledLabels?: Set;
		postRegistration?: boolean;
	}

	let {
		title,
		showCTA = true,
		compact = false,
		isMobile = false,
		disabledLabels = new Set(['']),
		postRegistration = false
	}: Props = $props();

	const translatedTitle = $derived(title || $_('hero.title'));
	const translatedPoweredBy = $derived($_('hero.poweredBy'));

	type LeaderboardStats = {
		companies: number;
		corporations: number;
		participants: number;
	};

	let stats = $state<LeaderboardStats | null>(null);
	let statsLoading = $state(true);
	let activitiesCount = $state<number | null>(null);

	const TARGET_DATE = new Date('2026-03-15T00:00:00+05:30');

	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	function calcCountdown() {
		const diff = TARGET_DATE.getTime() - Date.now();
		if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
		return {
			days: Math.floor(diff / (1000 * 60 * 60 * 24)),
			hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
			minutes: Math.floor((diff / (1000 * 60)) % 60),
			seconds: Math.floor((diff / 1000) % 60),
			done: false
		};
	}

	const initial = calcCountdown();
	let days = $state(initial.days);
	let hours = $state(initial.hours);
	let minutes = $state(initial.minutes);
	let seconds = $state(initial.seconds);
	let countdownDone = $state(initial.done);

	function updateCountdown() {
		const c = calcCountdown();
		days = c.days;
		hours = c.hours;
		minutes = c.minutes;
		seconds = c.seconds;
		countdownDone = c.done;
		if (c.done && countdownInterval) clearInterval(countdownInterval);
	}

	async function loadLeaderboardStats() {
		try {
			statsLoading = true;

			const res = await fetch('https://assets.hejjegala.in/leaderboard/city.json');
			if (!res.ok) throw new Error(`Failed to load leaderboard (${res.status})`);

			const data = await res.json();
			const dimensions = data?.dimensions || {};
			const commuteAll = dimensions.commuteAll || dimensions.recreationAll || Object.values(dimensions)[0];
			const rows = commuteAll?.rows || [];

			stats = {
				corporations: rows.length,
				companies: rows.reduce((sum: number, r: { companies?: number }) => sum + (r.companies || 0), 0),
				participants: rows.reduce((sum: number, r: { employees?: number }) => sum + (r.employees || 0), 0)
			};
		} catch (err) {
			console.error('Error loading leaderboard stats', err);
			stats = null;
		} finally {
			statsLoading = false;
		}
	}

	async function loadActivitiesCount() {
		try {
			const isLocal = typeof window !== 'undefined' &&
				(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

			let data: EventsData | null = null;

			if (!isLocal) {
				try {
					const res = await fetch(urls.eventsJson);
					if (res.ok) data = await res.json();
				} catch {
					// Remote failed
				}
			}

			if (!data && isLocal) {
				try {
					const res = await fetch('/data/sample-events.json');
					if (res.ok) data = await res.json();
				} catch {
					// Local fallback also failed
				}
			}

			activitiesCount = data?.events?.length ?? 0;
		} catch (err) {
			console.error('Error loading activities count', err);
			activitiesCount = 0;
		}
	}

	onMount(() => {
		loadLeaderboardStats();
		loadActivitiesCount();
		updateCountdown();
		countdownInterval = setInterval(updateCountdown, 1000);
		return () => {
			if (countdownInterval) clearInterval(countdownInterval);
		};
	});

	const formatCount = (value: number | null | undefined) =>
		typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('en-IN') : '—';

	const bannerImage = $derived(compact ? '/assets/about-banner.webp' : '/assets/landing-banner.webp');
</script>

<Header {isMobile} {disabledLabels} />
<section class="bg-white">
	{#if compact}
		<div
			class="hero-section relative mx-auto max-w-[90%]"
			style="--banner-image: url('{bannerImage}'); aspect-ratio: 1782 / 500;"
		>
			<div
				class="relative z-10 mx-auto max-w-[95%] lg:max-w-[80%] px-6 py-8 lg:py-12 overflow-x-hidden"
			>
				<div class="hero-text text-center">
					<h1 class="hidden mb-6 text-3xl leading-tight font-bold text-white lg:text-5xl xl:text-6xl max-w-4xl mx-auto">
						{translatedTitle}
					</h1>
				</div>
			</div>
		</div>
	{:else}
		<div
			class="hero-section relative mx-auto max-w-[90%]"
			style="--banner-image: url('{bannerImage}'); aspect-ratio: 1782 / 769;"
		>
			<div
				class="absolute inset-0 z-10 flex flex-col items-center justify-between px-6 pt-8 pb-4 lg:pt-12 lg:pb-8"
			>
				<div class="hero-text text-center">
					<h1 class="mt-2 mb-4 text-xl sm:text-2xl lg:mt-4 lg:mb-6 leading-tight font-bold text-white lg:text-5xl xl:text-6xl max-w-4xl mx-auto">
						{translatedTitle}
					</h1>
					{#if showCTA}
						<div class="mb-6 flex justify-center lg:mb-12">
							{#if postRegistration}
								<CTAButton text={$_('common.viewLeaderboard')} variant="pink" href="/leaderboard" />
							{:else}
								<CTAButton
									text={$_('common.becomeAChampion')}
									variant="pink"
									href={urls.becomeAChampion}
								/>
							{/if}
						</div>
					{/if}
				</div>

				<div class="hero-text flex justify-center gap-2 sm:gap-4 lg:gap-6">
					{#if countdownDone}
						<div class="flex flex-col items-center gap-2 lg:gap-3">
							<span class="text-lg sm:text-2xl font-bold text-white lg:text-4xl xl:text-5xl">
								{$_('hero.challengeIsLive')}
							</span>
							<span class="text-xs sm:text-sm lg:text-base text-white/80">
								{$_('hero.joinNowCTA')}
							</span>
						</div>
					{:else}
						<div class="flex flex-col items-center">
							<span class="text-lg sm:text-2xl font-bold text-white lg:text-5xl xl:text-6xl">{String(days).padStart(2, '0')}</span>
							<span class="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white/80 lg:text-sm">{$_('countdownTimer.days')}</span>
						</div>
						<span class="text-lg sm:text-2xl font-bold text-white lg:text-5xl xl:text-6xl">:</span>
						<div class="flex flex-col items-center">
							<span class="text-lg sm:text-2xl font-bold text-white lg:text-5xl xl:text-6xl">{String(hours).padStart(2, '0')}</span>
							<span class="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white/80 lg:text-sm">{$_('countdownTimer.hours')}</span>
						</div>
						<span class="text-lg sm:text-2xl font-bold text-white lg:text-5xl xl:text-6xl">:</span>
						<div class="flex flex-col items-center">
							<span class="text-lg sm:text-2xl font-bold text-white lg:text-5xl xl:text-6xl">{String(minutes).padStart(2, '0')}</span>
							<span class="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white/80 lg:text-sm">{$_('countdownTimer.minutes')}</span>
						</div>
						<span class="text-lg sm:text-2xl font-bold text-white lg:text-5xl xl:text-6xl">:</span>
						<div class="flex flex-col items-center">
							<span class="text-lg sm:text-2xl font-bold text-white lg:text-5xl xl:text-6xl">{String(seconds).padStart(2, '0')}</span>
							<span class="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white/80 lg:text-sm">{$_('countdownTimer.seconds')}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</section>

{#if !compact}
	<!-- Powered By and Logos row -->
	<div class="z-20 w-full bg-white px-6 py-3 lg:py-4">
		<div
			class="flex items-center gap-4 lg:gap-6 xl:gap-8 flex-wrap lg:flex-nowrap justify-center"
		>
			<p class="text-base lg:text-xl xl:text-2xl font-medium tracking-wider text-black whitespace-nowrap">
				{translatedPoweredBy}
			</p>
			<OrganizationLogos {isMobile} />
		</div>
	</div>

	<!-- Company and Corporation count - Full width blue background like Header -->
	<div class="relative mt-2 lg:mt-4 left-0 right-0 bg-[#0D6BA3] z-20">
		<div
			class="mx-auto max-w-[95%] xl:max-w-[80%] px-6 py-3 lg:py-4"
		>
			{#if postRegistration}
				<div class="flex justify-center">
					<span
						class="text-xl xl:text-2xl font-bold text-white uppercase tracking-wider"
					>
						{$_('hero.challengeIsLive')}
					</span>
				</div>
			{:else}
				<div class="flex justify-center gap-8 lg:gap-12 xl:gap-20">
					<!-- Participants -->
					<div class="flex flex-col items-center">
						<span class="text-xl xl:text-2xl font-bold text-white">
							{#if statsLoading}
								<span class="inline-block h-5 w-16 animate-pulse rounded bg-white/30"></span>
							{:else}
								{formatCount(stats?.participants)}
							{/if}
						</span>
						<span
							class="text-sm font-medium text-white uppercase tracking-wider mt-0.5"
						>
							{$_('corporateLeaders.participants')}
						</span>
					</div>
					<!-- Companies -->
					<div class="flex flex-col items-center">
						<span class="text-xl xl:text-2xl font-bold text-white">
							{#if statsLoading}
								<span class="inline-block h-5 w-16 animate-pulse rounded bg-white/30"></span>
							{:else}
								{formatCount(stats?.companies)}
							{/if}
						</span>
						<span
							class="text-sm font-medium text-white uppercase tracking-wider mt-0.5"
						>
							{$_('welcome.companies')}
						</span>
					</div>
					<!-- Corporations -->
					<div class="flex flex-col items-center">
						<span class="text-xl xl:text-2xl font-bold text-white">
							{#if statsLoading}
								<span class="inline-block h-5 w-16 animate-pulse rounded bg-white/30"></span>
							{:else}
								{formatCount(stats?.corporations)}
							{/if}
						</span>
						<span
							class="text-sm font-medium text-white uppercase tracking-wider mt-0.5"
						>
							{$_('welcome.corporations')}
						</span>
					</div>
					<!-- Events -->
					<div class="flex flex-col items-center">
						<span class="text-xl xl:text-2xl font-bold text-white">
							{#if activitiesCount === null}
								<span class="inline-block h-5 w-16 animate-pulse rounded bg-white/30"></span>
							{:else}
								{formatCount(activitiesCount)}
							{/if}
						</span>
						<span
							class="text-sm font-medium text-white uppercase tracking-wider mt-0.5"
						>
							{$_('events.title')}
						</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.hero-section {
		overflow: hidden;
		background-color: transparent;
	}

	.hero-section::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image: var(--banner-image);
		background-size: cover;
		background-position: top center;
		background-repeat: no-repeat;
		/* Darken only the image pixels using filter */
		filter: brightness(0.6);
		z-index: 0;
	}

	.hero-text {
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}
</style>
