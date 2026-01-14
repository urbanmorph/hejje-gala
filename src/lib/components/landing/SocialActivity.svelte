<script lang="ts">
	import { _ } from 'svelte-i18n';
	import AssetCard from './AssetCard.svelte';

	interface Props {
		isMobile?: boolean;
		entityName?: string;
	}

	let { isMobile = false, entityName }: Props = $props();

	type AssetItem = {
		url: string;
		type: 'image' | 'video';
		thumbnail?: string;
		alt?: string;
		publicUrl?: string;
		socialUrl?: string;
		author?: string;
	};

	const DEFAULT_SOCIAL_URL = 'https://www.instagram.com/hejjegala_2026/';
	const ROTATION_INTERVAL_MS = 5000;
	const MAX_DISPLAY_ASSETS = 8;
	const MAX_ASSETS = 20;

	let assets = $state([]);
	let loading = $state(true);
	let error = $state(null);
	let videoElements = $state(new Map());

	// Video rotation manager
	class VideoRotator {
		private videos: HTMLVideoElement[] = [];
		private currentIndex = -1;
		private interval: ReturnType | null = null;

		register(video: HTMLVideoElement, id: string) {
			if (!this.videos.includes(video)) {
				// Ensure video is paused when registered
				video.pause();
				this.videos.push(video);
				this.videos.sort((a, b) => {
					const aId = parseInt(a.dataset.videoId?.replace('video-', '') || '0');
					const bId = parseInt(b.dataset.videoId?.replace('video-', '') || '0');
					return aId - bId;
				});
			}
		}

		unregister(video: HTMLVideoElement) {
			this.videos = this.videos.filter((v) => v !== video);
			if (this.videos.length === 0) {
				this.stop();
			}
		}

		play(video: HTMLVideoElement) {
			// Pause ALL videos first
			this.videos.forEach((v) => {
				if (v !== video && !v.paused) {
					v.pause();
				}
			});

			// Play new video
			this.currentIndex = this.videos.indexOf(video);
			if (this.currentIndex === -1) return;

			video.play().catch(() => {
				// Autoplay prevented, ignore
			});
		}

		rotate() {
			if (this.videos.length === 0) return;
			this.currentIndex = (this.currentIndex + 1) % this.videos.length;
			this.play(this.videos[this.currentIndex]);
		}

		start() {
			if (this.interval) return;
			if (this.videos.length === 0) return;

			// Pause all videos first
			this.videos.forEach((v) => v.pause());

			// Play first video if none is playing
			if (this.currentIndex === -1 && this.videos.length > 0) {
				this.currentIndex = 0;
				this.videos[0].play().catch(() => {});
			}

			this.interval = setInterval(() => this.rotate(), ROTATION_INTERVAL_MS);
		}

		stop() {
			if (this.interval) {
				clearInterval(this.interval);
				this.interval = null;
			}
			if (this.videos[this.currentIndex]) {
				this.videos[this.currentIndex].pause();
			}
			this.currentIndex = -1;
		}
	}

	const rotator = new VideoRotator();

	// Load assets directly from assets.hejjegala.in
	async function loadAssets() {
		try {
			loading = true;
			error = null;
			const response = await fetch('https://assets.hejjegala.in/social/index.json');

			if (!response.ok) {
				if (response.status === 404) {
					// Return empty assets array if index.json doesn't exist yet
					assets = [];
					return;
				}
				throw new Error(`Failed to load assets (${response.status})`);
			}

			const indexData = await response.json();
			const loadedAssets =
				indexData.assets && Array.isArray(indexData.assets) ? indexData.assets : [];

			// Generate public URLs for assets
			const assetsWithUrls = loadedAssets.map((asset: AssetItem) => ({
				...asset,
				// Use assets.hejjegala.in for assets, or keep absolute URLs as-is
				publicUrl: asset.url.startsWith('http')
					? asset.url
					: `https://assets.hejjegala.in/social/${asset.url}`
			}));

			assets = assetsWithUrls.slice(0, MAX_ASSETS);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load social activity';
			assets = [];
		} finally {
			loading = false;
		}
	}

	// Handle asset click
	function handleAssetClick(asset: AssetItem) {
		const url = asset.socialUrl || DEFAULT_SOCIAL_URL;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	// Handle video registration
	function handleVideoRef(video: HTMLVideoElement, videoId: string) {
		video.dataset.videoId = videoId;
		videoElements.set(videoId, video);

		// Ensure video is paused initially
		video.pause();

		rotator.register(video, videoId);

		const playHandler = () => {
			// When any video starts playing, ensure only that one plays
			rotator.play(video);
		};
		video.addEventListener('play', playHandler);

		return () => {
			videoElements.delete(videoId);
			rotator.unregister(video);
			video.removeEventListener('play', playHandler);
		};
	}

	// Load assets on mount
	$effect(() => {
		loadAssets();
	});

	// Start video rotation when videos are ready
	$effect(() => {
		if (!loading && assets.length > 0) {
			const videoAssets = assets.filter((a) => a.type === 'video').slice(0, MAX_DISPLAY_ASSETS);
			if (videoAssets.length > 0 && videoElements.size > 0) {
				const timeoutId = setTimeout(() => {
					if (videoElements.size > 0) {
						rotator.start();
					}
				}, 300);

				return () => clearTimeout(timeoutId);
			}
		}
	});

	// Cleanup on unmount
	$effect(() => {
		return () => {
			rotator.stop();
		};
	});

	// Format entity name: append "Corporation" for Central/North/East/West/South
	const CORPORATION_NAMES = ['Central', 'North', 'East', 'West', 'South'];
	const displayEntityName = $derived(
		entityName
			? CORPORATION_NAMES.includes(entityName)
				? `${entityName} Corporation`
				: entityName
			: null
	);
</script>

{#if assets.length > 0}
	<section class="bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-16'}">
		<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-3 sm:px-4 md:px-6">
			<h2
				class="{isMobile
					? 'text-xl sm:text-2xl'
					: 'text-3xl'} font-medium text-[#DB3E3E] mb-8 sm:mb-12 md:mb-16 text-center lg:text-4xl break-words px-2"
			>
				{displayEntityName ? `Stories from ${displayEntityName}` : $_('socialActivity.title')}
			</h2>

			<div
				class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 {isMobile
					? 'max-h-[500px] sm:max-h-[600px]'
					: 'max-h-[750px]'} overflow-y-auto"
				style="grid-auto-rows: minmax(150px, auto);"
			>
				{#each assets.slice().reverse().slice(0, MAX_DISPLAY_ASSETS) as asset, index (asset.url)}
					<AssetCard {asset} {index} onClick={handleAssetClick} onVideoRef={handleVideoRef} />
				{/each}
			</div>

			{#if assets.length > MAX_DISPLAY_ASSETS}
				<div class="mt-6 sm:mt-8 text-center">
					<button
						class="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-[#00A640] text-white rounded-full font-semibold hover:bg-[#008A35] transition-colors"
						onclick={() => console.log('View all assets')}
					>
						{$_('socialActivity.viewAll')} ({assets.length}
						{$_('socialActivity.items')})
					</button>
				</div>
			{/if}
		</div>
	</section>
{/if}

<style>
	section :global(.grid > div) {
		position: relative;
		width: 100%;
	}
</style>
