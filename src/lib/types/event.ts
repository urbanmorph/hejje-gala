export interface CommunityEvent {
	id: string;
	title: string;
	description: string;
	type: 'Walk' | 'Cycle' | 'Other';
	startDate: string;
	endDate: string;
	venue: string;
	rsvpUrl?: string;
	websiteUrl?: string;
	mapsUrl?: string;
	posterUrl?: string;
	organizer: string;
}

export interface EventsData {
	updatedAt: string;
	events: CommunityEvent[];
}
