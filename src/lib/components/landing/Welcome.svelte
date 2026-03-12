<script lang="ts">
	import { welcomeConfig } from '$lib/config/landing';
	import CTAButton from './CTAButton.svelte';
	import OrbitalRing from './OrbitalRing.svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();
</script>

<section id="about" class="relative bg-[#FFFCF8] py-6 sm:py-8 lg:py-16">
	<div
		class="mx-auto max-w-[95%] xl:max-w-[80%] px-3 sm:px-4 md:px-6 overflow-hidden overflow-x-hidden"
	>
		<div class="grid items-center gap-6 sm:gap-8 md:grid-cols-2">
			<!-- About image -->
			<div
				class="relative hidden md:flex justify-center"
			>
				<div
					class="relative z-10 flex h-48 w-48 sm:h-64 sm:w-64 lg:h-80 lg:w-80 xl:h-[500px] xl:w-[500px] items-center justify-center"
				>
					<img
						src="/assets/circle.png"
						alt="Active Mobility"
						class="h-3/5 w-3/5 object-contain"
					/>
					<OrbitalRing />
				</div>
			</div>

			<div class="space-y-4 sm:space-y-6 text-center md:text-left">
				<div class="space-y-3 sm:space-y-4 relative">
					<h2
						class="relative inline-block text-2xl sm:text-3xl lg:text-4xl xl:text-7xl leading-tight font-bold text-gray-900"
					>
						<span
							class="hidden md:block absolute left-[calc(-50%-12rem)] right-[calc(-17vw)] top-1/2 h-12 -translate-y-1/2 bg-gradient-to-r from-[#22D394] to-[#143DE8] opacity-20"
							style="mask-image: radial-gradient(ellipse 250px 300px at left center, transparent 0%, transparent 30%, black 50%, black 100%); -webkit-mask-image: radial-gradient(ellipse 250px 300px at left center, transparent 0%, transparent 30%, black 50%, black 100%);"
						></span>
						<span class="relative z-10 break-words">
							{$_('welcome.about')} <span class="text-red-500">{$_('welcome.highlightText')}</span>
						</span>
					</h2>
					<p
						class="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 break-words"
					>
						{$_('welcome.subtitle')}
					</p>
					<p
						class="text-sm sm:text-base lg:text-xl xl:text-2xl font-medium text-gray-700 leading-relaxed max-w-full px-1 md:max-w-[90%] xl:max-w-[80%] md:px-0"
					>
						{$_('welcome.description')}
					</p>
				</div>
				<div class="pt-2 sm:pt-4 flex justify-center md:justify-start">
					<CTAButton text={$_('common.knowMore')} variant="green" href="/about" />
				</div>
			</div>
		</div>
	</div>
</section>
