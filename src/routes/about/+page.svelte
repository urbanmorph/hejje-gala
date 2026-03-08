<script lang="ts">
	import { onMount } from 'svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import WhatIsHejjeGala from '$lib/components/landing/WhatIsHejjeGala.svelte';
	import WhyHejjeGala from '$lib/components/landing/WhyHejjeGala.svelte';
	import AboutFAQs from '$lib/components/landing/AboutFAQs.svelte';
	import FooterCTA from '$lib/components/landing/FooterCTA.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { _ } from 'svelte-i18n';
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
	<title>About · Hejje Gala Active Mobility Challenge</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFCF8]">
	<Hero title={$_('hero.aboutTitle')} showCTA={false} compact={true} {isMobile} />
	<WhatIsHejjeGala {isMobile} />
	<WhyHejjeGala {isMobile} />
	<AboutFAQs {isMobile} />
	<FooterCTA {isMobile} />
	<Footer {isMobile} />
</div>
