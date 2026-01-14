<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import GoToTop from '$lib/components/GoToTop.svelte';
	import { afterNavigate } from '$app/navigation';

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

{@render children()}

<GoToTop />
