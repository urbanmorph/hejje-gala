<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser, dev } from '$app/environment';
	import Header from '$lib/components/landing/Header.svelte';
	import Button from '$lib/components/ui/button/Button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Modal } from '$lib/components/ui/modal';
	import { ChevronDown, X } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';
	import GooglePlacesAutocomplete from '$lib/components/GooglePlacesAutocomplete.svelte';
	import localCompaniesJson from '$lib/assets/companies-blr.json';
	import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

	interface Company {
		id: number;
		name: string;
		address: string;
		empCount: number;
	}

	function getLocalCompanies(): Company[] {
		try {
			const data = localCompaniesJson as { success?: boolean; companies?: Company[] };
			if (data && Array.isArray(data.companies)) {
				return data.companies;
			}
		} catch (error) {
			console.error('Error loading local companies JSON:', error);
		}
		return [];
	}

	let organisationName = $state('');
	let representativeName = $state('');
	let representativeEmail = $state('');
	let representativeDesignation = $state('');
	let representativePhone = $state('');
	let numberOfEmployees = $state('');
	let selectedLocation: { lng: number; lat: number } | null = $state(null);
	let companies: Company[] = $state([]);
	let filteredCompanies: Company[] = $state([]);
	let showDropdown = $state(false);
	let isNewOrganisation = $state(false);
	let selectedCompanyId: number | undefined = $state(undefined);
	let dropdownContainer: HTMLDivElement;
	let filterTimeout: ReturnType | null = null;
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let showSuccessModal = $state(false);
	let redirectTimeout: ReturnType | null = null;

	onMount(() => {
		// Only load on client side
		if (!browser) {
			return () => {
				if (filterTimeout) {
					clearTimeout(filterTimeout);
				}
			};
		}

		// Load companies
		(async () => {
			// Always start with local companies
			const localCompanies = getLocalCompanies();
			if (localCompanies.length > 0) {
				companies = localCompanies;
			}

			try {
				const response = await fetch('https://assets.hejjegala.in/other/companies-blr.json');
				if (!response.ok) {
					throw new Error(`Failed to load companies (${response.status})`);
				}
				const companiesData = await response.json();
				const fetchedCompanies: Company[] = companiesData?.companies ?? [];

				// Merge local and fetched companies, de-duplicating by id
				const mergedById = new Map();
				for (const company of localCompanies) {
					mergedById.set(company.id, company);
				}
				for (const company of fetchedCompanies) {
					mergedById.set(company.id, company);
				}
				companies = Array.from(mergedById.values());
			} catch (err) {
				console.error('Error loading companies:', err);
				// If fetch fails, fall back to only using local companies
				companies = localCompanies;
			}
		})();

		// Handle click outside to close dropdown
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			if (dropdownContainer && !dropdownContainer.contains(target)) {
				showDropdown = false;
			}
		}

		window.addEventListener('click', handleClickOutside);
		return () => {
			window.removeEventListener('click', handleClickOutside);
			if (filterTimeout) {
				clearTimeout(filterTimeout);
			}
			if (redirectTimeout) {
				clearTimeout(redirectTimeout);
			}
		};
	});

	function filterCompanies(query: string) {
		if (!query.trim()) {
			filteredCompanies = [];
			showDropdown = false;
			return;
		}

		const queryLower = query.toLowerCase();
		filteredCompanies = companies.filter((company) =>
			company.name.toLowerCase().includes(queryLower)
		);
		showDropdown = filteredCompanies.length > 0;
	}

	function debouncedFilter(query: string) {
		if (filterTimeout) {
			clearTimeout(filterTimeout);
		}
		filterTimeout = setTimeout(() => {
			filterCompanies(query);
		}, 150); // 150ms debounce for smooth typing
	}

	function checkIfNewOrganisation(query: string) {
		if (!query.trim()) {
			isNewOrganisation = false;
			selectedCompanyId = undefined;
			numberOfEmployees = '';
			selectedLocation = null;
			return;
		}

		const queryLower = query.toLowerCase();
		const exactMatch = companies.find((company) => company.name.toLowerCase() === queryLower);

		if (exactMatch) {
			isNewOrganisation = false;
			selectedCompanyId = exactMatch.id;
			numberOfEmployees = exactMatch.empCount.toString();
			selectedLocation = null;
		} else {
			isNewOrganisation = true;
			selectedCompanyId = undefined;
		}
	}

	function handleOrganisationInput(event: Event) {
		const target = event.target as HTMLInputElement;
		organisationName = target.value;
		// Only filter for dropdown while typing (debounced)
		debouncedFilter(organisationName);
	}

	function handleOrganisationBlur() {
		// Check if it's a new organisation only on blur
		checkIfNewOrganisation(organisationName);
		showDropdown = false;
	}

	function selectCompany(company: Company) {
		organisationName = company.name;
		showDropdown = false;
		isNewOrganisation = false;
		selectedCompanyId = company.id;
		numberOfEmployees = company.empCount.toString();
		selectedLocation = null; // Clear location for existing companies
	}

	function handlePlaceChanged(event: CustomEvent) {
		const { place } = event.detail;
		// Extract coordinates from the place result
		// place.geometry.location has lat() and lng() methods
		if (place.geometry?.location) {
			selectedLocation = {
				lat: place.geometry.location.lat(),
				lng: place.geometry.location.lng()
			};
		}
	}

	function handleClose() {
		goto('/');
	}

	async function handleSubmit() {
		if (isSubmitting) return;

		// Clear previous error messages
		errorMessage = '';

		// Validate required fields
		if (!organisationName.trim()) {
			errorMessage = $_('register.pleaseEnterOrganisationName');
			return;
		}
		if (!representativeName.trim()) {
			errorMessage = $_('register.pleaseEnterName');
			return;
		}
		if (!representativeEmail.trim()) {
			errorMessage = $_('register.pleaseEnterEmail');
			return;
		}
		if (!representativeDesignation.trim()) {
			errorMessage = $_('register.pleaseEnterDesignation');
			return;
		}
		if (!representativePhone.trim()) {
			errorMessage = $_('register.pleaseEnterPhone');
			return;
		}
		if (isNewOrganisation && !selectedLocation) {
			errorMessage = $_('register.pleaseSelectLocation');
			return;
		}
		if (isNewOrganisation && !numberOfEmployees) {
			errorMessage = $_('register.pleaseEnterNumberOfEmployees');
			return;
		}

		isSubmitting = true;

		const payload = {
			organisationName,
			representativeName,
			representativeEmail,
			representativeDesignation,
			representativePhone,
			numberOfEmployees: isNewOrganisation ? numberOfEmployees : undefined,
			selectedLocation: isNewOrganisation ? selectedLocation : null,
			isNewOrganisation,
			selectedCompanyId: !isNewOrganisation ? selectedCompanyId : undefined
		};

		// Console log before sending POST request
		console.log('Sending registration request:', payload);

		try {
			const response = await fetch('/api/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			const data = await response.json();

			if (data.success) {
				errorMessage = '';
				// Reset form
				organisationName = '';
				representativeName = '';
				representativeEmail = '';
				representativeDesignation = '';
				representativePhone = '';
				numberOfEmployees = '';
				selectedLocation = null;
				isNewOrganisation = false;
				selectedCompanyId = undefined;
				// Show success modal
				showSuccessModal = true;
			} else {
				errorMessage = $_('register.errorSubmittingRegistration');
			}
		} catch (error) {
			console.error('Error submitting registration:', error);
			errorMessage = $_('register.errorSubmittingRegistration');
		} finally {
			isSubmitting = false;
		}
	}

	function handleModalClose() {
		showSuccessModal = false;
		if (redirectTimeout) {
			clearTimeout(redirectTimeout);
			redirectTimeout = null;
		}
		goto('/');
	}

	function openTestModal() {
		showSuccessModal = true;
	}

	// Auto-redirect after 15 seconds when modal opens
	$effect(() => {
		if (showSuccessModal && browser) {
			// Clear any existing timeout
			if (redirectTimeout) {
				clearTimeout(redirectTimeout);
			}
			// Set new timeout to redirect after 15 seconds
			redirectTimeout = setTimeout(() => {
				showSuccessModal = false;
				redirectTimeout = null;
				goto('/');
			}, 15000);
		} else if (!showSuccessModal && redirectTimeout) {
			// Clear timeout if modal is closed before 15 seconds
			clearTimeout(redirectTimeout);
			redirectTimeout = null;
		}

		// Cleanup function
		return () => {
			if (redirectTimeout) {
				clearTimeout(redirectTimeout);
				redirectTimeout = null;
			}
		};
	});
</script>

<svelte:head>
	<title>Hejje Gala</title>
</svelte:head>

<div
	class="relative min-h-screen overflow-hidden bg-cover bg-center"
	style="background-image: url('/assets/registration-banner.webp');"
>
	<Header />

	<div
		class="relative z-10 mt-10 flex min-h-screen items-center justify-center px-3 sm:px-4 py-8 sm:py-12"
	>
		<div class="mx-auto w-full max-w-2xl">
			<!-- Gradient Border Wrapper -->
			<div
				class="rounded-2xl sm:rounded-[32px] p-2 sm:p-[16px]"
				style="background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 80%, rgba(255, 255, 255, 0.05) 100%); backdrop-filter: blur(8px);"
			>
				<!-- Form Container -->
				<div class="rounded-2xl sm:rounded-[32px] bg-white p-4 sm:p-6 md:p-8 shadow-2xl relative">
					<!-- Close Button -->
					<button
						type="button"
						onclick={handleClose}
						class="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
						aria-label={$_('common.close')}
					>
						<X class="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
					</button>
					<!-- Dev Mode Test Modal Button -->
					{#if dev}
						<button
							type="button"
							onclick={openTestModal}
							class="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-1 sm:px-3 sm:py-2 text-xs font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300"
							aria-label="Test Modal (Dev Mode)"
						>
							Test Modal
						</button>
					{/if}
					<div class="mb-6 sm:mb-8 flex justify-center">
						<img
							src="/assets/logo-footer.png"
							alt="Hejje Gala Logo"
							class="h-10 sm:h-12 w-auto object-contain"
						/>
					</div>

					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleSubmit();
						}}
						class="space-y-4 sm:space-y-6"
					>
						<!-- Organisation Name -->
						<div bind:this={dropdownContainer} class="organisation-dropdown-container">
							<Label for="organisation-name">{$_('register.organisationName')}</Label>
							<div class="relative">
								<Input
									id="organisation-name"
									type="text"
									value={organisationName}
									oninput={handleOrganisationInput}
									onblur={handleOrganisationBlur}
									onfocus={() => {
										if (organisationName) {
											filterCompanies(organisationName);
										}
									}}
									placeholder={$_('register.organisationNamePlaceholder')}
									required
								/>
								<ChevronDown
									class="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none"
								/>
								<!-- Dropdown -->
								{#if showDropdown && filteredCompanies.length > 0}
									<div
										class="absolute z-50 mt-1 w-full max-h-48 sm:max-h-60 overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg"
									>
										{#each filteredCompanies as company (company.id)}
											<button
												type="button"
												class="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
												onclick={() => selectCompany(company)}
												onmousedown={(e) => e.preventDefault()}
											>
												<div class="font-medium break-words">{company.name}</div>
												<div class="text-xs text-gray-500 break-words">{company.address}</div>
											</button>
										{/each}
									</div>
								{/if}
							</div>
						</div>

						<!-- Place Autocomplete - Only show for new organisations -->
						{#if isNewOrganisation}
							<div>
								<Label>{$_('register.organisationLocation')}</Label>
								<GooglePlacesAutocomplete
									apiKey={PUBLIC_GOOGLE_MAPS_API_KEY}
									options={{
										bounds: {
											south: 12.5,
											north: 13.5,
											west: 77,
											east: 78.25
										},
										fields: ['geometry', 'place_id'],
										strictBounds: true
									}}
									placeholder={$_('register.organisationLocationPlaceholder')}
									className="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
									on:place_changed={handlePlaceChanged}
								/>
							</div>
						{/if}

						<!-- Representative Name -->
						<div>
							<Label for="representative-name">{$_('register.representativeName')}</Label>
							<Input
								id="representative-name"
								type="text"
								bind:value={representativeName}
								placeholder={$_('register.representativeNamePlaceholder')}
								required
							/>
						</div>

						<!-- Representative Email -->
						<div>
							<Label for="representative-email">{$_('register.representativeEmail')}</Label>
							<Input
								id="representative-email"
								type="email"
								bind:value={representativeEmail}
								placeholder={$_('register.representativeEmailPlaceholder')}
								required
							/>
						</div>

						<!-- Representative Designation -->
						<div>
							<Label for="representative-designation"
								>{$_('register.representativeDesignation')}</Label
							>
							<Input
								id="representative-designation"
								type="text"
								bind:value={representativeDesignation}
								placeholder={$_('register.representativeDesignationPlaceholder')}
								required
							/>
						</div>

						<!-- Representative Phone -->
						<div>
							<Label for="representative-phone">{$_('register.representativePhone')}</Label>
							<div class="flex">
								<div
									class="flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-700"
								>
									+91
								</div>
								<Input
									id="representative-phone"
									type="tel"
									bind:value={representativePhone}
									placeholder={$_('register.representativePhonePlaceholder')}
									required
									class="!rounded-l-none"
								/>
							</div>
						</div>

						<!-- Number of Employees - Only show for new organisations -->
						{#if isNewOrganisation}
							<div>
								<Label for="number-of-employees">{$_('register.numberOfEmployees')}</Label>
								<Input
									id="number-of-employees"
									type="number"
									bind:value={numberOfEmployees}
									placeholder={$_('register.numberOfEmployeesPlaceholder')}
									min="1"
									required
								/>
							</div>
						{/if}

						<!-- Error Message -->
						{#if errorMessage}
							<div class="pt-2">
								<p class="text-sm text-red-600 font-medium">{errorMessage}</p>
							</div>
						{/if}

						<!-- Register Now Button -->
						<div class="pt-2 sm:pt-4">
							<Button
								type="submit"
								variant="ghost"
								size="lg"
								disabled={isSubmitting}
								class="!h-auto w-full !rounded-full bg-[#39BC36] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider !text-white uppercase shadow-md transition-all duration-200 hover:bg-[#35a83f] disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSubmitting ? $_('register.registering') : $_('common.registerNow')}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>

	<!-- Success Modal -->
	<Modal
		open={showSuccessModal}
		onClose={handleModalClose}
		title={$_('register.registrationSuccessTitle')}
		message={$_('register.registrationSuccessMessage')}
		buttonText={$_('register.goBackToHome')}
		lottieSrc="/lottie/congratulations.json"
		confettiSrc="/lottie/confetti.json"
	/>
</div>
