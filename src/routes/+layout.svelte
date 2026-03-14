<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import GoToTop from '$lib/components/GoToTop.svelte';
	import { afterNavigate } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { _ } from 'svelte-i18n';

	let { children } = $props();

	const messageKeys = [
		{ emoji: '🚶', key: 'loading.steps' },
		{ emoji: '🚴', key: 'loading.pedalling' },
		{ emoji: '🌳', key: 'loading.trees' },
		{ emoji: '🏙️', key: 'loading.streets' },
		{ emoji: '👣', key: 'loading.hejje' },
		{ emoji: '🌿', key: 'loading.fuel' },
		{ emoji: '🚌', key: 'loading.lastMile' },
		{ emoji: '🗺️', key: 'loading.mapping' }
	];

	let messageIndex = $state(Math.floor(Math.random() * messageKeys.length));
	let rotateInterval: ReturnType<typeof setInterval> | null = null;

	const loadingEmoji = $derived(messageKeys[messageIndex].emoji);
	const loadingMessage = $derived($_(messageKeys[messageIndex].key));

	$effect(() => {
		if ($navigating) {
			messageIndex = Math.floor(Math.random() * messageKeys.length);
			rotateInterval = setInterval(() => {
				messageIndex = (messageIndex + 1) % messageKeys.length;
			}, 2000);
		} else {
			if (rotateInterval) {
				clearInterval(rotateInterval);
				rotateInterval = null;
			}
		}
	});

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
	<div class="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
		<div class="flex flex-col items-center gap-4">
			<div class="relative flex items-center justify-center">
				<div class="h-14 w-14 rounded-full border-4 border-gray-200 border-t-[#00A63E] animate-spin"></div>
				<span class="absolute text-xl">{loadingEmoji}</span>
			</div>
			<p class="text-sm sm:text-base font-medium text-gray-700 text-center px-4">{loadingMessage}</p>
		</div>
	</div>
{/if}

{@render children()}

<GoToTop />
