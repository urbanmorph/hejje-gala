<script lang="ts">
	import { onMount } from 'svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import Welcome from '$lib/components/landing/Welcome.svelte';
	import Stats from '$lib/components/landing/Stats.svelte';
	import CorporatesSection from '$lib/components/landing/CorporatesSection.svelte';
	import IndividualsSection from '$lib/components/landing/IndividualsSection.svelte';
	import SocialActivity from '$lib/components/landing/SocialActivity.svelte';
	import FooterCTA from '$lib/components/landing/FooterCTA.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import GbaLetterButton from '$lib/components/GbaLetterButton.svelte';
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
	<Hero {isMobile} showCTA={false} />

	<!-- Corporates & Individuals split section -->
	<section class="bg-[#FFFCF8] py-6 sm:py-8 lg:py-16 xl:py-24">
		<div class="mx-auto max-w-[95%] xl:max-w-[80%] px-3 sm:px-4 md:px-6">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 xl:gap-12">
				<div class="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6 xl:p-8 shadow-sm">
					<CorporatesSection {isMobile} />
				</div>
				<div class="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6 xl:p-8 shadow-sm">
					<IndividualsSection {isMobile} />
				</div>
			</div>
		</div>
	</section>

	<Welcome {isMobile} />
	<SocialActivity {isMobile} />
	<Stats {isMobile} />
	<FooterCTA {isMobile} />
	<Footer {isMobile} />
</div>

<GbaLetterButton />
