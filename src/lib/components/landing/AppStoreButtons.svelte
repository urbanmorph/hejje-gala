<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		className?: string;
	}

	let { size = 'md', className = '' }: Props = $props();

	const sizeClasses = {
		sm: 'h-8',
		md: 'h-10',
		lg: 'h-12'
	};
</script>

<div class="flex items-center gap-2 {className}">
	<a href="https://play.google.com" target="_blank" rel="noopener noreferrer">
		<img
			src="/assets/play-store.png"
			alt="Get it on Google Play"
			class="{sizeClasses[size]} w-auto object-contain transition-opacity hover:opacity-80"
		/>
	</a>
	<a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer">
		<img
			src="/assets/app-store.png"
			alt="Download on App Store"
			class="{sizeClasses[size]} w-auto object-contain transition-opacity hover:opacity-80"
		/>
	</a>
</div>
