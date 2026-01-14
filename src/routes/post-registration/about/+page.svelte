<script lang="ts">
	import { onMount } from 'svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import WhatIsHejjeGala from '$lib/components/landing/WhatIsHejjeGala.svelte';
	import WhyHejjeGala from '$lib/components/landing/WhyHejjeGala.svelte';
	import Why from '$lib/components/landing/Why.svelte';
	import SocialActivity from '$lib/components/landing/SocialActivity.svelte';
	import AboutFAQs from '$lib/components/landing/AboutFAQs.svelte';
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
	<Hero
		title={$_('hero.aboutTitle')}
		showCountdown={false}
		showCTA={false}
		compact={true}
		{isMobile}
		disabledLabels={new Set([])}
	/>
	<WhatIsHejjeGala {isMobile} />
	<WhyHejjeGala {isMobile} />
	<Why {isMobile} />
	<SocialActivity {isMobile} />
	<AboutFAQs {isMobile} />
	<Footer {isMobile} disabledLabels={new Set([])} />
</div>
