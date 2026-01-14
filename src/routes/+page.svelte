<script lang="ts">
	import { onMount } from 'svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import Welcome from '$lib/components/landing/Welcome.svelte';
	import Stats from '$lib/components/landing/Stats.svelte';
	import Why from '$lib/components/landing/Why.svelte';
	import SocialActivity from '$lib/components/landing/SocialActivity.svelte';
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
	<Hero {isMobile} />
	<Welcome {isMobile} />
	<Stats {isMobile} />
	<Why {isMobile} />
	<SocialActivity {isMobile} />
	<MobilityBills {isMobile} />
	<FooterCTA {isMobile} />
	<Footer {isMobile} />
</div>
