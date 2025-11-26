<script lang="ts">
	interface Props {
		dotPositions?: Array<{ x: number; y: number }>;
	}

	let {
		dotPositions = [
			{ x: 181, y: 60 },
			{ x: 190, y: 100 },
			{ x: 181, y: 140 }
		]
	}: Props = $props();
</script>

<svg class="absolute inset-0 h-full w-full" viewBox="0 0 200 200">
	<defs>
		<linearGradient id="orbitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" style="stop-color:#A7F3D0;stop-opacity:1" />
			<stop offset="50%" style="stop-color:#93C5FD;stop-opacity:1" />
			<stop offset="100%" style="stop-color:#A7F3D0;stop-opacity:1" />
		</linearGradient>
	</defs>
	<path
		d="M 100 10 A 90 90 0 0 1 100 190"
		fill="none"
		stroke="url(#orbitGradient)"
		stroke-width="1"
		opacity="0.6"
	/>
	{#each dotPositions as pos, i}
		{@const lineLength = 32}
		{@const lineX = pos.x + lineLength}
		<line
			x1={pos.x}
			y1={pos.y}
			x2={lineX}
			y2={pos.y}
			stroke="url(#orbitGradient)"
			stroke-width="1.5"
			opacity="0.6"
		/>
		<circle cx={pos.x} cy={pos.y} r="3" fill="#EC4899" />
	{/each}
</svg>
