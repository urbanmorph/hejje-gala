// Landing page configuration
// This file centralizes all the text, links, and data used in the landing page
// Modify values here to update the landing page content

export const siteConfig = {
	name: 'Hejje Gala',
	title: 'Active Mobility Challenge',
	description: 'Track your active commutes, measure your impact, and gamify your experience'
};

export const navigation = [
	{ label: 'Home', href: '#' },
	{ label: 'Leaderboard', href: '/leaderboard' },
	{ label: 'Champions', href: '/champions' },
	{ label: 'Activities', href: '/activities' },
	{ label: 'About Challenge', href: '/about' },
	{ label: 'FAQs', href: '/about#faqs' }
];

export const heroConfig = {
	title: "Bengaluru's Active Mobility Challenge",
	ctaText: 'BECOME A CHAMPION',
	poweredBy: [
		{ name: 'altmo', logo: null },
		{ name: 'WRI INDIA', logo: null }
	]
};

export const welcomeConfig = {
	title: 'About',
	highlightText: 'Hejje Gala',
	subtitle: "Bengaluru's Active Mobility Challenge",
	description:
		'Hejje Gala is a city-wide active mobility event that encourages Bengalureans to walk and cycle -- whether as a primary commute mode or as a first- and last-mile link to public transport -- fostering healthier, greener movement across the city.',
	ctaText: 'KNOW MORE',
	ctaLink: '/about'
};

export type StatsMetricKey = 'co2Offset' | 'fuelSaved' | 'people' | 'distance';

export const statsConfig = {
	title: 'Track your activities with altmo',
	description: 'Track your active commutes, measure your impact, and gamify your experience!',
	metrics: [
		{
			key: 'co2Offset' as StatsMetricKey,
			value: '5,07,026',
			label: 'CO2 offset (kgs)',
			icon: '/assets/icon-co2.png',
			color: 'text-green-500'
		},
		{
			key: 'fuelSaved' as StatsMetricKey,
			value: '2,19,004',
			label: 'Fuel saved (Itrs)',
			icon: '/assets/icon-fuel.png',
			color: 'text-green-500'
		},
		{
			key: 'people' as StatsMetricKey,
			value: '9,023',
			label: 'Active Users',
			icon: '/assets/icon-users.png',
			color: 'text-green-500'
		},
		{
			key: 'distance' as StatsMetricKey,
			value: '2,08,360',
			label: 'Distance covered (km)',
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

export type CityViewMode = 'city' | 'corporation' | 'company';

export const citySectionConfig = {
	modes: [
		{ id: 'city' as CityViewMode, label: 'City' },
		{ id: 'corporation' as CityViewMode, label: 'Corporation' },
		{ id: 'company' as CityViewMode, label: 'Company' }
	],
	city: {
		title: 'Corporations',
		description:
			"Compare corporate participation across Bengaluru's zones – East, West, Central, South, North, and ELCITA. Each zone is ranked based on employee participation, carbon savings, activities completed, distance covered, and cost savings."
	},
	corporation: {
		title: 'Corporation view',
		description:
			'Dive deeper into a corporation and see how individual companies are performing within the challenge.',
		label: 'Selected corporation',
		activityTitle: 'Company activity overview',
		activitySubtitle:
			'Sample numbers to illustrate how this view will display performance insights.'
	},
	company: {
		title: 'Company view',
		description:
			'Zoom in to an individual company to see its performance, policies and active mobility initiatives.',
		label: 'Selected company',
		summary:
			'The company view brings together key indicators, from engagement and activities to emissions avoided and policy actions taken.',
		bentoTitle: 'Bento activities'
	}
};

export const footerCTAConfig = {
	title: 'Active Mobility Challenge Branding',
	description: 'Track your Active commutes',
	ctaText: 'BECOME A CHAMPION'
};

export const footerConfig = {
	links: navigation,
	social: [
		{ platform: 'instagram', href: 'https://www.instagram.com/hejjegala_2026/', label: 'Instagram' }
	]
};
