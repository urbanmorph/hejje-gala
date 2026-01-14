<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';

	export let value: number = 0;
	export let duration = 800;
	export let format: (n: number) => string = (n) => String(Math.round(n));

	const animated = tweened(0, {
		duration,
		easing: cubicOut
	});

	let hasInitialized = false;
	let element: HTMLSpanElement | null = null;

	// Animate when the incoming value changes after initialization
	$: if (hasInitialized) {
		animated.set(value, { duration, easing: cubicOut });
	}

	onMount(() => {
		// In environments without IntersectionObserver (very old browsers), fall back to
		// animating immediately on mount.
		if (typeof IntersectionObserver === 'undefined' || !element) {
			hasInitialized = true;
			animated.set(value, { duration, easing: cubicOut });
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					hasInitialized = true;
					animated.set(value, { duration, easing: cubicOut });
					observer.disconnect();
				}
			},
			{
				threshold: 0.3
			}
		);

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	});
</script>

<span bind:this={element}>{format($animated)}</span>
