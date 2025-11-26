<script lang="ts">
	import { heroConfig } from '$lib/config/landing';
	import CountdownTimer from './CountdownTimer.svelte';
	import CTAButton from './CTAButton.svelte';
	import OrganizationLogos from './OrganizationLogos.svelte';
	import Header from './Header.svelte';
</script>

<section
	class="hero-section relative min-h-screen overflow-hidden bg-cover bg-center pt-16"
	style="background-image: url('/assets/banner.png');"
>
	<Header />
	<div class="relative z-10 mx-auto max-w-7xl px-6 py-32">
		<div class="text-center">
			<h1 class="mb-12 text-4xl leading-tight font-bold text-white lg:text-5xl">
				{heroConfig.title}
			</h1>
			<CountdownTimer targetDate={heroConfig.countdownDate} />
		</div>
	</div>

	<div class="absolute right-0 bottom-80 left-0 z-20 text-center">
		<CTAButton text={heroConfig.ctaText} variant="pink" href={heroConfig.ctaLink} />
	</div>

	<div class="absolute right-0 bottom-[96px] left-0 z-20 text-center">
		<p class="text-xl font-medium tracking-wider text-white">POWERED BY</p>
	</div>

	<OrganizationLogos />
</section>
