<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/landing/Header.svelte';
	import Champions from '$lib/components/landing/Champions.svelte';
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
	<title>Champions - Hejje Gala</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFCF8]">
	<Header {isMobile} />
	<Champions {isMobile} />
	<Footer {isMobile} />
</div>
