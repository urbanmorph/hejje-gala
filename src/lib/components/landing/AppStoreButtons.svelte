<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		border?: 'true' | 'false';
		className?: string;
		invert?: boolean;
	}

	let { size = 'md', border = 'false', className = '', invert = false }: Props = $props();

	const sizeClasses = {
		sm: 'h-8',
		md: 'h-10',
		lg: 'h-12'
	};
</script>

<div class="flex items-center gap-2 {className}">
	<a
		href="https://play.google.com/store/apps/details?id=app.altmo.altmo"
		target="_blank"
		rel="noopener noreferrer"
	>
		<img
			src="/assets/play-store.png"
			alt="Get it on Google Play"
			class="{sizeClasses[
				size
			]} w-auto object-contain transition-opacity hover:opacity-80 {border === 'true'
				? 'border-1 border-black rounded-full'
				: ''} {invert ? 'invert' : ''}"
		/>
	</a>
	<a href="https://testflight.apple.com/join/yPhZ7qJV" target="_blank" rel="noopener noreferrer">
		<img
			src="/assets/app-store.png"
			alt="Download on App Store"
			class="{sizeClasses[
				size
			]} w-auto object-contain transition-opacity hover:opacity-80 {border === 'true'
				? 'border-1 border-black rounded-full'
				: ''} {invert ? 'invert' : ''}"
		/>
	</a>
</div>
