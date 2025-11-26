<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	interface Props {
		onPointSelect?: (lng: number, lat: number) => void;
	}

	let { onPointSelect }: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let marker: maplibregl.Marker | null = null;

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				sources: {
					'osm-tiles': {
						type: 'raster',
						tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution:
							'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					}
				},
				layers: [
					{
						id: 'osm-tiles-layer',
						type: 'raster',
						source: 'osm-tiles'
					}
				]
			},
			center: [77.5775, 12.9629], // Default to Bengaluru, India
			zoom: 9
		});

		map.on('load', () => {
			// Add click handler to place marker
			map?.on('click', (e) => {
				const { lng, lat } = e.lngLat;

				// Remove existing marker
				if (marker) {
					marker.remove();
				}

				// Add new marker
				marker = new maplibregl.Marker({
					color: '#39BC36',
					draggable: true
				})
					.setLngLat([lng, lat])
					.addTo(map!);

				// Call callback if provided
				onPointSelect?.(lng, lat);

				// Update marker position on drag
				marker.on('dragend', () => {
					const position = marker!.getLngLat();
					onPointSelect?.(position.lng, position.lat);
				});
			});
		});

		return () => {
			if (marker) {
				marker.remove();
			}
			if (map) {
				map.remove();
			}
		};
	});
</script>

<div bind:this={mapContainer} class="h-full w-full rounded-lg" />

<style>
	:global(.maplibregl-popup-content) {
		padding: 0;
	}
</style>
