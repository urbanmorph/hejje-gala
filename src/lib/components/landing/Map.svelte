<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { _ } from 'svelte-i18n';

	// ========== Constants ==========
	const MAP_CONFIG = {
		center: [77.5946, 12.9916] as [number, number],
		zoom: 10,
		bounds: [[76.6, 12.0], [78.6, 14.0]] as [[number, number], [number, number]],
		style: 'https://tiles.openfreemap.org/styles/bright',
		locationsUrl: 'https://assets.hejjegala.in/other/locations.json'
	};

	const LAYER_IDS = {
		bus: { unclustered: 'bus-stops', cluster: 'bus-clusters' },
		metro: { lines: 'metro-lines', stations: 'metro-stations' },
		cycle: 'cycleways',
		companyMarker: 'company-marker',
		companyLabel: 'company-label'
	} as const;

	const CORPORATION_NAMES = ['Central', 'North', 'East', 'West', 'South', 'ELCITA'];

	// ========== Types ==========
	type Coordinates = Record<string, { center: [number, number]; zoom: number }>;
	type CoordData = { corporation: Coordinates; company: Coordinates };
	type LayerVisibility = { bus: boolean; metro: boolean; cycle: boolean };
	type FlyToState = { center: [number, number]; zoom: number; corpId: string | null; companyId: string | null };

	// ========== Props ==========
	export let center: [number, number] = MAP_CONFIG.center;
	export let zoom: number = MAP_CONFIG.zoom;
	export let selectedCorpId: string | null = null;
	export let selectedCompanyId: string | null = null;
	export let name: string | null = null;
	export let isMobile: boolean = false;

	// ========== State ==========
	let mapContainer: HTMLDivElement;
	let map: MapLibreMap | null = null;
	let coordinates: CoordData = { corporation: {}, company: {} };
	let coordinatesLoaded = false;
	let companiesData: { companies: Array<{ companyId: string; companyName: string; corporationId: string }> } | null = null;
	let companiesLoaded = false;
	let visibility: LayerVisibility = { bus: true, metro: true, cycle: true };
	let lastFlewTo: FlyToState | null = null;

	// ========== Utilities ==========
	const getMapAssets = () => {
		const origin = window.location.origin;
		return {
			bus: `${origin}/geo/bus.json`,
			metro: `${origin}/geo/metro.json`,
			cycle: `${origin}/geo/cycle.geojson`,
			busIcon: `${origin}/assets/bus-black.svg`,
			metroDefaultIcon: `${origin}/assets/metro.svg`,
			metroPurpleIcon: `${origin}/assets/metro-purple.svg`,
			metroGreenIcon: `${origin}/assets/metro-green.svg`,
			metroYellowIcon: `${origin}/assets/metro-yellow.svg`
		};
	};

	const svgUrlToImageData = (url: string, width = 48, height = 48): Promise<ImageData> =>
		new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) return reject(new Error('Could not get canvas context'));
				ctx.drawImage(img, 0, 0, width, height);
				resolve(ctx.getImageData(0, 0, width, height));
			};
			img.onerror = () => reject(new Error(`Failed to load SVG from ${url}`));
			img.src = url;
		});

	// ========== Coordinate Helpers ==========
	const getCompanyName = (): string | null => {
		if (!companiesLoaded || !selectedCompanyId) return null;
		const company = companiesData?.companies?.find((c) => c.companyId === selectedCompanyId);
		return company?.companyName || null;
	};

	const getCompanyCoordinates = (): { center: [number, number]; zoom: number } | null => {
		if (!coordinatesLoaded || !companiesLoaded || !selectedCompanyId || !selectedCorpId) return null;
		
		// selectedCompanyId is now a numeric ID (string)
		// Use it directly to look up coordinates in locations.json
		const coords = coordinates.company[selectedCompanyId] || coordinates.company.default;
		if (!coords) return null;
		
		// Always use zoom level 14 for companies
		return { ...coords, zoom: 14 };
	};

	const getTargetCoordinates = (): { center: [number, number]; zoom: number } | null => {
		if (!coordinatesLoaded) return null;
		if (selectedCompanyId && selectedCorpId) return getCompanyCoordinates();
		if (selectedCorpId) return coordinates.corporation[selectedCorpId] || null;
		return null;
	};

	const getInitialView = () => {
		const coords = getTargetCoordinates();
		return {
			center: coords?.center || center,
			zoom: coords?.zoom || zoom
		};
	};

	// ========== Map Layer Configuration ==========
	const getLayerConfigs = () => {
		const metroIconMatch = ['match', ['get', 'station_colors'], 'purple', 'metro-station-icon-purple', 'green', 'metro-station-icon-green', 'yellow', 'metro-station-icon-yellow', 'metro-station-icon-default'];
		const busLayout = {
			'icon-image': 'bus-stop-icon',
			'icon-allow-overlap': false,
			'icon-size': 0.2
		};

		return {
			cycle: {
				id: LAYER_IDS.cycle,
				type: 'line' as const,
				source: 'cycle',
				paint: { 'line-color': '#808080', 'line-width': 4, 'line-opacity': 0.8 }
			},
			metroLines: {
				id: LAYER_IDS.metro.lines,
				type: 'line' as const,
				source: 'metro',
				filter: ['==', ['geometry-type'], 'LineString'],
				paint: { 'line-color': ['coalesce', ['get', 'line_color'], '#6b21a8'], 'line-width': 3, 'line-opacity': 0.9 }
			},
			metroStations: {
				id: LAYER_IDS.metro.stations,
				type: 'symbol' as const,
				source: 'metro',
				filter: ['==', ['geometry-type'], 'Point'],
				layout: {
					'icon-image': metroIconMatch,
					'icon-allow-overlap': false,
					'icon-size': 0.4,
					'text-field': ['get', 'name'],
					'text-font': ['Open Sans Semibold', 'Open Sans Regular', 'Arial Unicode MS Regular'],
					'text-size': 11,
					'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
					'text-radial-offset': 0.8,
					'text-anchor': 'center'
				},
				paint: {
					'text-color': ['match', ['get', 'station_colors'], 'purple', '#7e22ce', 'green', '#15803d', 'yellow', '#eab308', '#374151'],
					'text-halo-color': '#ffffff',
					'text-halo-width': 1.2,
					'text-opacity': ['step', ['zoom'], 0, 11, 1]
				}
			},
			busCluster: {
				id: LAYER_IDS.bus.cluster,
				type: 'symbol' as const,
				source: 'bus',
				filter: ['has', 'point_count'],
				layout: busLayout,
				paint: {}
			},
			busUnclustered: {
				id: LAYER_IDS.bus.unclustered,
				type: 'symbol' as const,
				source: 'bus',
				filter: ['!', ['has', 'point_count']],
				layout: {
					...busLayout,
					'text-field': ['get', 'name'],
					'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
					'text-size': 11,
					'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
					'text-radial-offset': 0.9,
					'text-anchor': 'center'
				},
				paint: {
					'text-color': '#000000',
					'text-halo-color': '#FFFCF8',
					'text-halo-width': 2,
					'text-opacity': ['step', ['zoom'], 0, 14.5, 1]
				}
			}
		};
	};

	// ========== Map Operations ==========
	const setLayerVisibility = (layerId: string, visible: boolean) => {
		if (!map?.getLayer(layerId)) return;
		map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
	};

	const addLayer = (mapInstance: MapLibreMap, config: any) => {
		if (mapInstance.getLayer(config.id)) return;
		mapInstance.addLayer(config);
	};

	const hideBaseMapLabels = (mapInstance: MapLibreMap) => {
		['label_village', 'label_town'].forEach((id) => {
			if (mapInstance.getLayer(id)) {
				mapInstance.setLayoutProperty(id, 'visibility', 'none');
			}
		});
	};

	const ensureSources = (mapInstance: MapLibreMap, assets: ReturnType<typeof getMapAssets>) => {
		const sources = [
			{ id: 'bus', config: { type: 'geojson' as const, data: assets.bus, cluster: true, clusterMaxZoom: 13, clusterRadius: 32 } },
			{ id: 'metro', config: { type: 'geojson' as const, data: assets.metro } },
			{ id: 'cycle', config: { type: 'geojson' as const, data: assets.cycle } }
		];
		sources.forEach(({ id, config }) => {
			if (!mapInstance.getSource(id)) mapInstance.addSource(id, config);
		});
	};

	const registerIcons = async (mapInstance: MapLibreMap, assets: ReturnType<typeof getMapAssets>) => {
		const iconConfigs = [
			{ name: 'bus-stop-icon', url: assets.busIcon },
			{ name: 'metro-station-icon-default', url: assets.metroDefaultIcon },
			{ name: 'metro-station-icon-purple', url: assets.metroPurpleIcon },
			{ name: 'metro-station-icon-green', url: assets.metroGreenIcon },
			{ name: 'metro-station-icon-yellow', url: assets.metroYellowIcon }
		];
		await Promise.all(
			iconConfigs.map(async ({ name, url }) => {
				if (mapInstance.hasImage(name)) return;
				try {
					const imageData = await svgUrlToImageData(url, 48, 48);
					mapInstance.addImage(name, imageData as any);
				} catch (error) {
					console.error(`Failed to load icon ${name}:`, error);
				}
			})
		);
	};

	const addAllLayers = (mapInstance: MapLibreMap) => {
		const configs = getLayerConfigs();
		const layers = [
			{ ...configs.cycle, layout: { visibility: visibility.cycle ? 'visible' : 'none' } },
			{ ...configs.metroLines, layout: { visibility: visibility.metro ? 'visible' : 'none' } },
			{ ...configs.metroStations, layout: { ...configs.metroStations.layout, visibility: visibility.metro ? 'visible' : 'none' } },
			{ ...configs.busCluster, layout: { ...configs.busCluster.layout, visibility: visibility.bus ? 'visible' : 'none' } },
			{ ...configs.busUnclustered, layout: { ...configs.busUnclustered.layout, visibility: visibility.bus ? 'visible' : 'none' } }
		];
		layers.forEach((layer) => addLayer(mapInstance, layer));
		[LAYER_IDS.metro.lines, LAYER_IDS.metro.stations].forEach((id) => {
			try {
				if (mapInstance.getLayer(id)) mapInstance.moveLayer(id);
			} catch (error) {
				console.warn(`Failed to move layer ${id}:`, error);
			}
		});
	};

	const updateCompanyMarker = (mapInstance: MapLibreMap, coords: { center: [number, number] } | null) => {
		const sourceId = 'company-marker';
		// Remove existing layers and source
		if (mapInstance.getLayer(LAYER_IDS.companyLabel)) mapInstance.removeLayer(LAYER_IDS.companyLabel);
		if (mapInstance.getLayer(LAYER_IDS.companyMarker)) mapInstance.removeLayer(LAYER_IDS.companyMarker);
		if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
		if (!coords?.center) return;

		const companyName = getCompanyName();
		const featureProperties = companyName ? { name: companyName } : {};

		mapInstance.addSource(sourceId, {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: { type: 'Point', coordinates: coords.center },
						properties: featureProperties
					}
				]
			}
		});

		// Add circle marker (black)
		addLayer(mapInstance, {
			id: LAYER_IDS.companyMarker,
			type: 'circle',
			source: sourceId,
			paint: {
				'circle-radius': 6,
				'circle-color': '#000000',
				'circle-stroke-width': 2,
				'circle-stroke-color': '#FFFFFF',
				'circle-opacity': 1
			}
		});

		// Add text label if company name is available
		if (companyName) {
			addLayer(mapInstance, {
				id: LAYER_IDS.companyLabel,
				type: 'symbol',
				source: sourceId,
				layout: {
					'text-field': ['get', 'name'],
					'text-font': ['Open Sans Semibold', 'Open Sans Regular', 'Arial Unicode MS Regular'],
					'text-size': 12,
					'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
					'text-radial-offset': 0.8,
					'text-anchor': 'center',
					'text-allow-overlap': false
				},
				paint: {
					'text-color': '#1F2937',
					'text-halo-color': '#FFFFFF',
					'text-halo-width': 2,
					'text-opacity': 1
				}
			});
		}

		try {
			mapInstance.moveLayer(LAYER_IDS.companyMarker);
			if (companyName) {
				mapInstance.moveLayer(LAYER_IDS.companyLabel);
			}
		} catch (error) {
			console.warn('Failed to move company marker layer:', error);
		}
	};

	const shouldFlyTo = (targetCenter: [number, number], targetZoom: number): boolean => {
		if (!lastFlewTo) return true;
		return (
			lastFlewTo.corpId !== selectedCorpId ||
			lastFlewTo.companyId !== selectedCompanyId ||
			Math.abs(lastFlewTo.center[0] - targetCenter[0]) > 0.0001 ||
			Math.abs(lastFlewTo.center[1] - targetCenter[1]) > 0.0001 ||
			Math.abs(lastFlewTo.zoom - targetZoom) > 0.1
		);
	};

	const flyToCoordinates = (targetCenter: [number, number], targetZoom: number) => {
		if (!map || !map.isStyleLoaded() || !shouldFlyTo(targetCenter, targetZoom)) return;
		requestAnimationFrame(() => {
			if (map && map.isStyleLoaded()) {
				map.flyTo({ center: targetCenter, zoom: targetZoom, duration: 1000 });
				lastFlewTo = { center: targetCenter, zoom: targetZoom, corpId: selectedCorpId, companyId: selectedCompanyId };
			}
		});
	};

	// ========== Data Loading ==========
	const loadCoordinates = async (): Promise<void> => {
		try {
			const response = await fetch(MAP_CONFIG.locationsUrl);
			if (response.ok) {
				const data = await response.json();
				coordinates = {
					corporation: data.CORPORATION_COORDINATES || {},
					company: data.COMPANY_COORDINATES || {}
				};
			} else {
				console.error('Failed to load locations.json:', response.statusText);
			}
		} catch (error) {
			console.error('Error loading locations.json:', error);
		} finally {
			coordinatesLoaded = true;
			lastFlewTo = null;
		}
	};

	const loadCompanies = async (): Promise<void> => {
		try {
			const response = await fetch('https://assets.hejjegala.in/leaderboard/companies.json');
			if (response.ok) {
				companiesData = await response.json();
			} else {
				console.error('Failed to load companies.json:', response.statusText);
			}
		} catch (error) {
			console.error('Error loading companies.json:', error);
		} finally {
			companiesLoaded = true;
		}
	};

	// ========== Map Initialization ==========
	onMount(() => {
		let cleanup: (() => void) | null = null;

		Promise.all([loadCoordinates(), loadCompanies()]).then(() => {
			const { center: initCenter, zoom: initZoom } = getInitialView();
			map = new maplibregl.Map({
				container: mapContainer,
				style: MAP_CONFIG.style,
				center: initCenter,
				zoom: initZoom,
				maxBounds: MAP_CONFIG.bounds
			});

			map.on('load', async () => {
				if (!map) return;
				const assets = getMapAssets();
				hideBaseMapLabels(map);
				ensureSources(map, assets);
				await registerIcons(map, assets);
				addAllLayers(map);

				const coords = getCompanyCoordinates();
				if (coords) updateCompanyMarker(map, coords);
			});

			map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

			map.on('load', () => {
				if (map) {
					map.removeLayer('poi_transit');
					map.removeLayer('poi_r1');
					map.removeLayer('poi_r7');
				}
			})

			cleanup = () => {
				map?.remove();
				map = null;
			};
		});

		return () => {
			cleanup?.();
		};
	});

	// ========== Reactive Updates ==========
	$: if (map) {
		setLayerVisibility(LAYER_IDS.bus.unclustered, visibility.bus);
		setLayerVisibility(LAYER_IDS.bus.cluster, visibility.bus);
		setLayerVisibility(LAYER_IDS.metro.lines, visibility.metro);
		setLayerVisibility(LAYER_IDS.metro.stations, visibility.metro);
		setLayerVisibility(LAYER_IDS.cycle, visibility.cycle);
	}

	$: if (map && coordinatesLoaded && companiesLoaded && map.isStyleLoaded()) {
		const coords = getTargetCoordinates();
		const targetCenter = coords?.center || (!selectedCorpId && !selectedCompanyId ? MAP_CONFIG.center : null);
		const targetZoom = coords?.zoom || (!selectedCorpId && !selectedCompanyId ? MAP_CONFIG.zoom : null);

		if (targetCenter && targetZoom !== null) flyToCoordinates(targetCenter, targetZoom);
		const companyCoords = getCompanyCoordinates();
		updateCompanyMarker(map, companyCoords);
	}

	$: displayName = name ? (CORPORATION_NAMES.includes(name) ? `${name} Corporation` : name) : '';

	const toggleButtons = [
		{ key: 'metro' as const, label: $_('map.metro') },
		{ key: 'bus' as const, label: $_('map.bus') },
		{ key: 'cycle' as const, label: $_('map.cycle') }
	];
</script>

<section class="pt-0 {isMobile ? 'pb-4' : 'pb-8'}">
	<div class="bg-[#FFFCF8] {isMobile ? 'px-4 py-3' : 'px-6 py-4'}">
		<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'}">
			<div class="flex items-center justify-center {isMobile ? 'mb-4' : 'mb-8'} flex-wrap gap-4">
				<h1
					class="font-medium text-[#DB3E3E] text-center {isMobile
						? 'text-xl'
						: 'text-2xl lg:text-4xl'}"
				>
					{$_('map.mapTitle')}
					{displayName}
				</h1>
			</div>
		</div>
	</div>
	<div class="mx-auto {isMobile ? 'max-w-[95%] px-4' : 'max-w-[80%] px-6'}">
		<div class="{isMobile ? 'mb-4' : 'mb-6'} flex justify-center">
			<div class="inline-flex items-center {isMobile ? 'gap-2 flex-wrap' : 'gap-5 lg:gap-64'}">
				{#each toggleButtons as { key, label }}
					<button
						type="button"
						class="inline-flex items-center {isMobile
							? 'gap-2 px-3 py-2 text-xs'
							: 'gap-3 px-6 py-3.5 text-base'} rounded-full border border-[#00A640] bg-white font-semibold text-[#00A640] transition-all hover:opacity-80"
						on:click={() => (visibility[key] = !visibility[key])}
					>
						<div
							class="flex {isMobile
								? 'h-4 w-4'
								: 'h-6 w-6'} items-center justify-center rounded-full
							{visibility[key] ? 'bg-[#00A640]' : 'bg-gray-300'}"
						>
							<svg
								class="{isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<span>{label}</span>
					</button>
				{/each}
			</div>
		</div>

		<div
			bind:this={mapContainer}
			class="relative {isMobile
				? 'h-[400px]'
				: 'h-[640px]'} w-full overflow-hidden border border-gray-100 bg-gray-100 shadow-lg"
		></div>
	</div>
</section>
