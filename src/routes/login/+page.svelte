<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { goto } from '$app/navigation';

	let email = $state('');
	let loading = $state(false);
	let message = $state(null);

	async function handleSubmit() {
		if (!email || !email.includes('@')) {
			message = { type: 'error', text: 'Please enter a valid email address' };
			return;
		}

		loading = true;
		message = null;

		try {
			const response = await fetch('/api/login/request', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			});

			const data = await response.json();

			if (response.ok && data.success) {
				message = {
					type: 'success',
					text: 'Check your email for a login link!'
				};
				email = '';
			} else {
				message = {
					type: 'error',
					text: data.error || 'Failed to send login email. Please try again.'
				};
			}
		} catch (error) {
			message = {
				type: 'error',
				text: 'An error occurred. Please try again.'
			};
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - Hejje Gala</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 sm:py-12">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-lg shadow-md p-6 sm:p-8">
			<h1 class="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Login</h1>

			<form on:submit|preventDefault={handleSubmit} class="space-y-4">
				<div>
					<Label for="email">Email Address</Label>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						bind:value={email}
						required
						disabled={loading}
						class="mt-1 w-full"
					/>
				</div>

				{#if message}
					<div
						class="p-3 rounded-md text-sm {message.type === 'success'
							? 'bg-green-50 text-green-800'
							: 'bg-red-50 text-red-800'}"
					>
						{message.text}
					</div>
				{/if}

				<Button type="submit" disabled={loading} class="w-full text-sm sm:text-base">
					{loading ? 'Sending...' : 'Send Login Link'}
				</Button>
			</form>

			<p class="mt-4 text-xs sm:text-sm text-gray-600 text-center">
				We'll send you a secure login link to your email address.
			</p>
		</div>
	</div>
</div>
