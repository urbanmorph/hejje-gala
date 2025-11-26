import { onMount } from 'svelte';

export function useScrollVisibility() {
	let isVisible = $state(true);
	let scrollY = $state(0);
	let viewportHeight = $state(0);

	onMount(() => {
		viewportHeight = window.innerHeight;
		scrollY = window.scrollY;

		const handleScroll = () => {
			scrollY = window.scrollY;
		};

		const handleResize = () => {
			viewportHeight = window.innerHeight;
			scrollY = window.scrollY;
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('resize', handleResize, { passive: true });

		$effect(() => {
			// Hide header after scrolling down more than 2% of the viewport height
			const scrollThreshold = viewportHeight * 0.02;
			isVisible = scrollY <= scrollThreshold;
		});

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', handleResize);
		};
	});

	return { isVisible };
}
