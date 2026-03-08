<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/landing/Header.svelte';
	import Activities from '$lib/components/landing/Activities.svelte';
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
	<title>Activities - Hejje Gala</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFCF8]">
	<Header {isMobile} />
	<Activities {isMobile} />
	<Footer {isMobile} />
</div>
