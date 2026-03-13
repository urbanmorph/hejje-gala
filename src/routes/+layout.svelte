<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import GoToTop from '$lib/components/GoToTop.svelte';
	import { afterNavigate } from '$app/navigation';
	import { navigating } from '$app/stores';

	let { children } = $props();

	const loadingMessages = [
		{ emoji: '🚶', text: 'Taking a few more steps...' },
		{ emoji: '🚴', text: 'Pedalling to your destination...' },
		{ emoji: '🌳', text: 'Planting trees along the way...' },
		{ emoji: '🏙️', text: 'Navigating Bengaluru streets...' },
		{ emoji: '👣', text: 'Every hejje counts...' },
		{ emoji: '🌿', text: 'Saving fuel, one ride at a time...' },
		{ emoji: '🚌', text: 'Catching the last mile...' },
		{ emoji: '🗺️', text: 'Mapping the route ahead...' }
	];

	const pick = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
	let loadingEmoji = $state(pick.emoji);
	let loadingMessage = $state(pick.text);

	$effect(() => {
		if ($navigating) {
			const msg = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
			loadingEmoji = msg.emoji;
			loadingMessage = msg.text;
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
