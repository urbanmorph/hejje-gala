<script lang="ts">
	import { footerCTAConfig } from '$lib/config/landing';
	import { urls } from '$lib/config/urls';
	import CTAButton from './CTAButton.svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();
</script>

<section
	class={isMobile ? 'py-6 sm:py-8' : 'py-16'}
	style="background: #DD2679; background-image: 
radial-gradient(ellipse at top left, #153CE9 0%, rgba(21, 60, 233, 0.6) 30%, transparent 60%),
radial-gradient(ellipse at bottom right, #153CE9 0%, rgba(21, 60, 233, 0.6) 30%, transparent 60%),
radial-gradient(ellipse at top center, #0E6AA2 0%, rgba(19, 110, 166, 0.9) 50%, transparent 75%),
radial-gradient(ellipse at bottom center, #0E6AA2 0%, rgba(19, 110, 166, 0.9) 50%, transparent 75%),
radial-gradient(ellipse at center center, rgba(19, 110, 166, 0.9) 0%, rgba(19, 110, 166, 0.9) 20%, transparent 75%),
radial-gradient(ellipse at top right, rgba(20, 184, 166, 0.0) 40%, rgba(20, 184, 166, 0.2) 50%, transparent 60%),
radial-gradient(ellipse at bottom left, rgba(20, 184, 166, 0.0) 40%, rgba(20, 184, 166, 0.2) 50%, transparent 60%),
radial-gradient(ellipse at top right, #DB3E3E 0%, transparent 40%),
radial-gradient(ellipse at bottom left, #DB3E3E 0%, transparent 40%);"
>
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-5xl'} px-3 sm:px-4 md:px-6 text-center">
		<img
			src="/assets/logo-footer-cta.png"
			alt="Logo"
			class="mx-auto mb-4 sm:mb-6 h-auto w-auto object-contain {isMobile
				? 'scale-50 sm:scale-60'
				: 'scale-75'} max-w-full"
		/>

		<div class="flex {isMobile ? 'flex-col items-center' : 'justify-center'} gap-4">
			<CTAButton text={$_('common.viewLeaderboard')} variant="pink" href="/leaderboard" />
			<CTAButton text={$_('common.viewActivities')} variant="pink" href="/activities" />
		</div>
	</div>
</section>
