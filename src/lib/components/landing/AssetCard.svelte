<script lang="ts">
	import InstagramIcon from './InstagramIcon.svelte';

	type AssetItem = {
		url: string;
		type: 'image' | 'video';
		thumbnail?: string;
		alt?: string;
		publicUrl?: string;
		socialUrl?: string;
		author?: string;
	};

	let {
		asset,
		index,
		onClick,
		onVideoRef
	}: {
		asset: AssetItem;
		index: number;
		onClick: (asset: AssetItem) => void;
		onVideoRef?: (video: HTMLVideoElement, videoId: string) => (() => void) | void;
	} = $props();

	const DEFAULT_AUTHOR = 'hejjegala';

	const getAssetUrl = (asset: AssetItem) => asset.publicUrl || asset.url;
	const getAuthor = (asset: AssetItem) => asset.author || DEFAULT_AUTHOR;

	const isVideo = asset.type === 'video';
	const isImage = asset.type === 'image';
	const videoId = `video-${index}`;
	let videoElement: HTMLVideoElement | null = null;

	function handleClick() {
		onClick(asset);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	function handleImageError(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		img.style.display = 'none';
	}

	$effect(() => {
		if (videoElement && onVideoRef) {
			const cleanup = onVideoRef(videoElement, videoId);
			return cleanup;
		}
	});
</script>

<div
	class="relative overflow-hidden rounded-2xl bg-gray-100 group transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-xl
		{isImage ? 'md:col-span-1 md:row-span-1 min-h-[250px]' : ''}
		{isVideo ? 'md:col-span-1 md:row-span-2 min-h-[500px]' : ''}
		h-full w-full cursor-pointer"
	onclick={handleClick}
	role="button"
	tabindex="0"
	onkeydown={handleKeydown}
>
	{#if isVideo}
		<video
			bind:this={videoElement}
			src={getAssetUrl(asset)}
			class="absolute inset-0 w-full h-full object-cover"
			muted
			loop
			playsinline
			preload="metadata"
			autoplay={false}
		></video>
		<div
			class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center"
		>
			<svg
				class="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
				fill="currentColor"
				viewBox="0 0 20 20"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>
	{:else}
		<img
			src={getAssetUrl(asset)}
			alt={asset.alt || ''}
			class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
			loading="lazy"
			onerror={handleImageError}
		/>
		<div
			class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
		></div>
	{/if}

	<div
		class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg pointer-events-none"
	>
		<InstagramIcon />
	</div>

	<div
		class="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none"
	>
		<p class="text-white text-sm font-medium drop-shadow-lg">@{getAuthor(asset)}</p>
	</div>

	{#if asset.alt}
		<div
			class="absolute inset-0 flex items-end justify-start p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
		>
			<div class="text-white">
				<p class="text-sm font-medium drop-shadow-lg">{asset.alt}</p>
			</div>
		</div>
	{/if}
</div>
