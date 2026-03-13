<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import GoToTop from '$lib/components/GoToTop.svelte';
	import { afterNavigate } from '$app/navigation';
	import { navigating } from '$app/stores';

	let { children } = $props();

	afterNavigate(({ to, from }) => {
		// Only scroll to top if navigating to a different page
		if (to && from && to.url.pathname !== from.url.pathname) {
			// Don't scroll if there's a hash fragment (e.g., #faqs)
			if (!to.url.hash) {
				window.scrollTo({ top: 0, behavior: 'instant' });
			}
		}
	});
</script>

{#if $navigating}
	<div class="fixed top-0 left-0 right-0 z-[9999]">
		<div class="h-1 bg-[#0D6BA3] animate-progress origin-left"></div>
	</div>
{/if}

{@render children()}

<GoToTop />

<style>
	@keyframes progress {
		0% { transform: scaleX(0); }
		50% { transform: scaleX(0.7); }
		100% { transform: scaleX(0.95); }
	}
	.animate-progress {
		animation: progress 2s ease-out forwards;
	}
</style>
