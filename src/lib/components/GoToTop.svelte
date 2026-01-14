<script lang="ts">
	import { onMount } from 'svelte';
	import { isMobile } from '$lib/utils';

	let showButton = $state(false);
	let isMobileDevice = $state(false);
	let isScrollingToTop = $state(false);

	function handleScroll() {
		if (typeof window === 'undefined') return;

		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
		const scrollPercentage = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;

		// If we're scrolling to top, check if we've reached the top or started scrolling down again
		if (isScrollingToTop) {
			if (scrollPercentage > 5) {
				isScrollingToTop = false;
			}
		}

		// Show button if scrolled more than 5% and on mobile (only when not scrolling to top)
		if (!isScrollingToTop) {
			showButton = isMobileDevice && scrollPercentage > 5;
		}
	}

	function scrollToTop() {
		if (typeof window === 'undefined') return;

		isScrollingToTop = true;

		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	}

	function checkMobile() {
		isMobileDevice = isMobile();
		// Re-evaluate button visibility when screen size changes
		handleScroll();
	}

	onMount(() => {
		checkMobile();
		handleScroll();

		window.addEventListener('scroll', handleScroll);
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>

{#if showButton}
	<button
		onclick={scrollToTop}
		class="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-[#231A36] text-white shadow-lg hover:bg-[#3a2d5a] transition-all duration-300 hover:scale-110"
		aria-label="Go to top"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="w-6 h-6"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
		</svg>
	</button>
{/if}
