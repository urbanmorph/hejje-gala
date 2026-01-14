<script lang="ts">
	import { onMount } from 'svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import LandingPageLeaderboard from '$lib/components/landing/LandingPageLeaderboard.svelte';
	import Stats from '$lib/components/landing/Stats.svelte';
	import MobilityBills from '$lib/components/landing/MobilityBills.svelte';
	import FooterCTA from '$lib/components/landing/FooterCTA.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { isMobile as checkIsMobile } from '$lib/utils';

	let isMobile = $state(false);

	function checkMobile() {
		isMobile = checkIsMobile();
	}

	onMount(() => {
		checkMobile();
		const resizeHandler = () => checkMobile();
		window.addEventListener('resize', resizeHandler);
		return () => {
			window.removeEventListener('resize', resizeHandler);
		};
	});
</script>

<svelte:head>
	<title>Hejje Gala</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFCF8]">
	<Hero {isMobile} disabledLabels={new Set([])} postRegistration={true} />
	<LandingPageLeaderboard {isMobile} />
	<Stats {isMobile} />
	<MobilityBills {isMobile} />
	<FooterCTA {isMobile} />
	<Footer {isMobile} disabledLabels={new Set([])} />
</div>
