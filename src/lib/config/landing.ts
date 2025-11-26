// Landing page configuration
// This file centralizes all the text, links, and data used in the landing page
// Modify values here to update the landing page content

export const siteConfig = {
	name: 'GBCAM',
	title: 'Active Mobility Challenge',
	description: 'Track your active commutes, measure your impact, and gamify your experience'
};

export const navigation = [
	{ label: 'Home', href: '#' },
	{ label: 'Leaderboard', href: '#leaderboard' },
	{ label: 'About Challenge', href: '#about' },
	{ label: 'Blog', href: '#blog' },
	{ label: 'FAQs', href: '#faqs' }
];

export const heroConfig = {
	title: 'Active Mobility Challenge Branding',
	// Countdown end date (you can set a specific date)
	countdownDate: new Date('2026-01-01T00:00:00'),
	ctaText: 'REGISTER NOW',
	ctaLink: '#register',
	poweredBy: [
		{ name: 'altmo', logo: null },
		{ name: 'WRI INDIA', logo: null }
	]
};

export const welcomeConfig = {
	title: 'Welcome to your journey of smart',
	highlightText: 'commuting!',
	features: [
		{
			title: 'Active Mobility Challenge Branding',
			description: 'Track your active commutes, measure your impact, and gamify your experience'
		},
		{
			title: 'Active Mobility Challenge Branding',
			description: 'Track your active commutes, measure your impact, and gamify your experience'
		},
		{
			title: 'Active Mobility Challenge Branding',
			description: 'Track your active commutes, measure your impact, and gamify your experience'
		}
	]
};

export const statsConfig = {
	title: 'Active Mobility Challenge Branding',
	description: 'Track your active commutes, measure your impact, and gamify your experience',
	metrics: [
		{
			value: '5,07,026',
			label: 'CO2 offset (kgs)',
			icon: '/assets/icon-co2.png',
			color: 'text-green-500'
		},
		{
			value: '2,19,004',
			label: 'Fuel saved (Itrs)',
			icon: '/assets/icon-fuel.png',
			color: 'text-green-500'
		},
		{
			value: '9,023',
			label: 'Active Users',
			icon: '/assets/icon-users.png',
			color: 'text-green-500'
		},
		{
			value: '2,08,360',
			label: 'Activities',
			icon: '/assets/icon-activities.png',
			color: 'text-green-500'
		}
	]
};

export const testimonialsConfig = {
	title: 'Happy Users',
	description: 'Track your active commutes, measure your impact, and gamify your experience',
	testimonials: [
		{
			name: 'Knerav',
			role: 'Org Name',
			image: '/placeholder-user-1.jpg',
			quote:
				"It's how you track your active commutes. Track your active commutes, measure your impact, and gamify your experience! It's how you track your active commutes."
		},
		{
			name: 'Sonal',
			role: 'Org Name',
			image: '/placeholder-user-2.jpg',
			quote:
				"It's how you track your active commutes. Track your active commutes, measure your impact, and gamify your experience! It's how you track your active commutes."
		},
		{
			name: 'Sowmya',
			role: 'Org Name',
			image: '/placeholder-user-3.jpg',
			quote:
				"It's how you track your active commutes. Track your active commutes, measure your impact, and gamify your experience! It's how you track your active commutes."
		}
	]
};

export const mobilityBillsConfig = {
	title: 'Mobility Bills',
	bills: [
		{ id: 'Bill 1', active: true },
		{ id: 'Bill 2', active: false },
		{ id: 'Bill 3', active: false }
	],
	description:
		'Egestas fringilla aliquam leo, habitasse arcu varius lorem elit. Neque pellentesque donec et tellus ac varius tortor, bibendum. Nulla felis ac turpis at amet. Purus malesuada placerat arcu at enim elit in accumsan.',
	ctaText: 'READ MORE',
	ctaLink: '#bills'
};

export const footerCTAConfig = {
	title: 'Active Mobility Challenge Branding',
	description: 'Track your Active commutes',
	ctaText: 'REGISTER NOW',
	ctaLink: '#register',
	appStoreLinks: {
		apple: 'https://apps.apple.com',
		google: 'https://play.google.com'
	}
};

export const footerConfig = {
	links: navigation,
	social: [
		{ platform: 'facebook', href: '#', label: 'Facebook' },
		{ platform: 'instagram', href: '#', label: 'Instagram' },
		{ platform: 'youtube', href: '#', label: 'YouTube' }
	]
};
