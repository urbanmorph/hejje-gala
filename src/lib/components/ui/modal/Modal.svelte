<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { X } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/Button.svelte';
	import { _ } from 'svelte-i18n';
	import { LottiePlayer } from '@lottiefiles/svelte-lottie-player';

	interface Props {
		open?: boolean;
		onClose?: () => void;
		title?: string;
		message?: string;
		showCloseButton?: boolean;
		buttonText?: string;
		lottieSrc?: string;
		confettiSrc?: string;
	}

	let {
		open = $bindable(false),
		onClose,
		title = '',
		message = '',
		showCloseButton = true,
		buttonText,
		lottieSrc,
		confettiSrc
	}: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		role="presentation"
	>
		<!-- Modal Content -->
		<div
			class="relative mx-4 w-full max-w-md"
			transition:fly={{ y: 20, duration: 200 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="-1"
		>
			<!-- Gradient Border Wrapper -->
			<div
				class="rounded-[32px] p-[16px]"
				style="background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 80%, rgba(255, 255, 255, 0.05) 100%); backdrop-filter: blur(8px);"
			>
				<!-- Modal Container -->
				<div class="rounded-[32px] bg-white p-8 shadow-2xl relative overflow-hidden">
					<!-- Confetti Background Animation -->
					{#if confettiSrc && open}
						<div class="absolute inset-0 pointer-events-none">
							<LottiePlayer
								src={confettiSrc}
								background="transparent"
								speed={1}
								style="width: 100%; height: 100%;"
								loop
								autoplay
							/>
						</div>
					{/if}

					<!-- Close Button -->
					{#if showCloseButton}
						<button
							type="button"
							onclick={handleClose}
							class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 z-10"
							aria-label={$_('common.close')}
						>
							<X class="h-5 w-5 text-gray-600" />
						</button>
					{/if}

					<!-- Logo -->
					<div class="mb-6 flex justify-center relative z-10">
						<img
							src="/assets/logo-footer.png"
							alt="Hejje Gala Logo"
							class="h-12 w-auto object-contain"
						/>
					</div>

					<!-- Lottie Animation -->
					{#if lottieSrc && open}
						<div class="mb-4 flex justify-center relative z-10">
							<LottiePlayer
								src={lottieSrc}
								background="transparent"
								speed={1}
								style="width: 200px; height: 200px;"
								loop
								autoplay
							/>
						</div>
					{/if}

					<!-- Title -->
					{#if title}
						<h2
							id="modal-title"
							class="mb-4 text-center text-2xl font-bold text-gray-900 relative z-10"
						>
							{title}
						</h2>
					{/if}

					<!-- Message -->
					{#if message}
						<div class="mb-6 text-center text-gray-700 leading-relaxed relative z-10">
							{#each message.split('\n') as line}
								<p>{line}</p>
							{/each}
						</div>
					{/if}

					<!-- Close Button -->
					<div class="flex justify-center relative z-10">
						<Button
							type="button"
							variant="ghost"
							size="lg"
							onclick={handleClose}
							class="!h-auto w-full !rounded-full bg-[#39BC36] px-8 py-4 text-lg font-semibold tracking-wider !text-white uppercase shadow-md transition-all duration-200 hover:bg-[#35a83f]"
						>
							{buttonText || $_('common.close')}
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
