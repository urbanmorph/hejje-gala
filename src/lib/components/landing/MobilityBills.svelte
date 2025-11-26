<script lang="ts">
	import Button from '../ui/button/Button.svelte';
	import { mobilityBillsConfig } from '$lib/config/landing';
	import PhoneWithEffects from './PhoneWithEffects.svelte';
</script>

<section class="bg-[#FFFCF8] py-16">
	<div class="mx-auto max-w-7xl px-6">
		<div class="relative flex items-start gap-0 lg:flex-row">
			<div class="relative z-10 rounded-xl bg-white p-8 shadow-sm lg:flex-1 lg:p-12">
				<div class="space-y-6 lg:max-w-[60%]">
					<div class="space-y-2">
						<h2 class="text-2xl font-bold text-pink-500 lg:text-3xl">
							{mobilityBillsConfig.title}
						</h2>
					</div>

					<div class="flex flex-row justify-between gap-0 border-b border-gray-200">
						{#each mobilityBillsConfig.bills as bill}
							<button
								class="rounded-t-lg px-6 py-3 text-sm font-medium transition-colors {bill.active
									? 'w-1/3 bg-gray-100 text-gray-900'
									: 'w-1/3 bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
							>
								{bill.id}
							</button>
						{/each}
					</div>

					<div class="space-y-4">
						<p class="text-base leading-relaxed text-gray-700">{mobilityBillsConfig.description}</p>
					</div>

					<div class="pt-4">
						<Button
							size="lg"
							class="relative !rounded-lg border-2 border-[#00A640] !bg-white px-8 py-3 text-sm font-semibold tracking-wider !text-[#00A640] uppercase transition-all duration-200 hover:!bg-[#00A640] hover:!text-white"
						>
							{mobilityBillsConfig.ctaText}
						</Button>
					</div>
				</div>
			</div>

			<PhoneWithEffects variant="starburst" />
		</div>
	</div>
</section>
