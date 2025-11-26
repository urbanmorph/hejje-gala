<script lang="ts">
	import { goto } from '$app/navigation';
	import Header from '$lib/components/landing/Header.svelte';
	import MapSelector from '$lib/components/MapSelector.svelte';
	import Button from '$lib/components/ui/button/Button.svelte';
	import { ChevronDown } from '@lucide/svelte';

	let organisationName = $state('');
	let representativeName = $state('');
	let representativeEmail = $state('');
	let numberOfEmployees = $state('');
	let selectedLocation: { lng: number; lat: number } | null = $state(null);

	function handlePointSelect(lng: number, lat: number) {
		selectedLocation = { lng, lat };
	}

	function handleSubmit() {
		// TODO: Implement form submission
		console.log('Form submitted:', {
			organisationName,
			representativeName,
			representativeEmail,
			numberOfEmployees,
			location: selectedLocation
		});
		// For now, just show an alert
		alert('Registration submitted! (This is a demo)');
	}
</script>

<svelte:head>
	<title>Register - Active Mobility Challenge</title>
</svelte:head>

<div
	class="relative min-h-screen overflow-hidden bg-cover bg-center"
	style="background-image: url('/assets/banner.png');"
>
	<Header />

	<div class="relative z-10 mt-10 flex min-h-screen items-center justify-center px-4 py-12">
		<div class="mx-auto w-full max-w-2xl">
			<!-- Gradient Border Wrapper -->
			<div
				class="rounded-[2.5rem] p-[12px]"
				style="background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 60%, rgba(255, 255, 255, 0.05) 100%); backdrop-filter: blur(8px);"
			>
				<!-- Form Container -->
				<div class="rounded-2xl bg-white p-8 shadow-2xl">
					<h1 class="mb-8 text-center font-[Manrope] text-3xl font-bold text-gray-900">
						Active Mobility Challenge
					</h1>

					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleSubmit();
						}}
						class="space-y-6"
					>
						<!-- Organisation Name -->
						<div>
							<label
								for="organisation-name"
								class="mb-2 block text-xs font-semibold tracking-wider text-gray-600 uppercase"
							>
								Organisation Name
							</label>
							<div class="relative">
								<input
									id="organisation-name"
									type="text"
									bind:value={organisationName}
									placeholder="Type your organisation name."
									class="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
									required
								/>
								<ChevronDown
									class="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-gray-400"
								/>
							</div>
						</div>

						<!-- Map Selector -->
						<div>
							<div
								class="h-80 w-full overflow-hidden rounded-lg border border-gray-300 bg-gray-100"
							>
								<MapSelector onPointSelect={handlePointSelect} />
							</div>
						</div>

						<!-- Representative Name -->
						<div>
							<label
								for="representative-name"
								class="mb-2 block text-xs font-semibold tracking-wider text-gray-600 uppercase"
							>
								Representative Name
							</label>
							<input
								id="representative-name"
								type="text"
								bind:value={representativeName}
								placeholder="Type your name here."
								class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
								required
							/>
						</div>

						<!-- Representative Email -->
						<div>
							<label
								for="representative-email"
								class="mb-2 block text-xs font-semibold tracking-wider text-gray-600 uppercase"
							>
								Representative Email
							</label>
							<input
								id="representative-email"
								type="email"
								bind:value={representativeEmail}
								placeholder="Type your email here."
								class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
								required
							/>
						</div>

						<!-- Number of Employees -->
						<div>
							<label
								for="number-of-employees"
								class="mb-2 block text-xs font-semibold tracking-wider text-gray-600 uppercase"
							>
								Number of Employees
							</label>
							<input
								id="number-of-employees"
								type="number"
								bind:value={numberOfEmployees}
								placeholder="Type number here."
								min="1"
								class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
								required
							/>
						</div>

						<!-- Register Now Button -->
						<div class="pt-4">
							<Button
								type="submit"
								variant="ghost"
								size="lg"
								class="!h-auto w-full !rounded-full bg-[#39BC36] px-8 py-4 text-lg font-semibold tracking-wider !text-white uppercase shadow-md transition-all duration-200 hover:bg-[#35a83f]"
							>
								Register Now
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
