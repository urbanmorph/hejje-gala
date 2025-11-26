<script lang="ts">
	import Header from '$lib/components/landing/Header.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import Welcome from '$lib/components/landing/Welcome.svelte';
	import Stats from '$lib/components/landing/Stats.svelte';
	import Testimonials from '$lib/components/landing/Testimonials.svelte';
	import MobilityBills from '$lib/components/landing/MobilityBills.svelte';
	import FooterCTA from '$lib/components/landing/FooterCTA.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
</script>

<svelte:head>
	<title>Active Mobility Challenge</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<Hero />
	<Welcome />
	<Stats />
	<Testimonials />
	<MobilityBills />
	<FooterCTA />
	<Footer />
</div>
