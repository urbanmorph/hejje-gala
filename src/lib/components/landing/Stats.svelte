<script lang="ts">
	import { statsConfig } from '$lib/config/landing';
	import PhoneWithEffects from './PhoneWithEffects.svelte';
</script>

<section class="bg-[#FFFCF8] py-16">
	<div class="mx-auto max-w-7xl px-6">
		<div class="relative flex items-start gap-0 lg:flex-row">
			<div class="relative z-10 rounded-3xl bg-white p-8 shadow-lg lg:flex-1 lg:p-12">
				<div class="space-y-6">
					<div class="space-y-2">
						<h2 class="text-2xl font-bold text-[#F03268] lg:text-3xl">{statsConfig.title}</h2>
						<p class="font-[Manrope] text-base font-medium text-[#2D2D2D]">
							{statsConfig.description}
						</p>
					</div>

					<div class="grid grid-cols-2 gap-8 pt-6">
						{#each statsConfig.metrics as stat}
							<div class="flex flex-col space-y-2">
								<div class="flex items-center gap-3">
									<div class="flex h-12 w-12 shrink-0 items-center justify-center">
										<img src={stat.icon} alt={stat.label} class="h-full w-full object-contain" />
									</div>
									<div class="flex flex-col">
										<div class="text-3xl font-bold text-green-500">{stat.value}</div>
										<p class="text-sm font-medium">{stat.label}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<PhoneWithEffects variant="blur" />
		</div>
	</div>
</section>
