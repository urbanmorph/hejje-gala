import { dev } from '$app/environment';
import type { RequestHandler, RequestEvent } from '@sveltejs/kit';
import type { CommunityEvent, EventsData } from '$lib/types/event';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const EVENTS_PATH = 'events/events.json';
const POSTERS_PREFIX = 'events/posters/';

function getR2Bucket(event: RequestEvent) {
	return event.platform?.env?.GALA_ASSETS || null;
}

function getLocalPaths() {
	const root = process.cwd();
	return {
		dataDir: join(root, 'static', 'data'),
		eventsFile: join(root, 'static', 'data', 'sample-events.json'),
		postersDir: join(root, 'static', 'data', 'posters')
	};
}

function generateEventId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).slice(2, 6);
	return `evt-${timestamp}-${random}`;
}

// --- R2 storage functions ---

async function getEventsDataR2(r2: R2Bucket): Promise<EventsData> {
	try {
		const file = await r2.get(EVENTS_PATH);
		if (file) {
			return (await file.json()) as EventsData;
		}
	} catch {
		// File doesn't exist yet
	}
	return { updatedAt: new Date().toISOString(), events: [] };
}

async function saveEventsDataR2(r2: R2Bucket, data: EventsData): Promise<void> {
	data.updatedAt = new Date().toISOString();
	await r2.put(EVENTS_PATH, JSON.stringify(data, null, '\t'), {
		httpMetadata: { contentType: 'application/json' }
	});
}

// --- Local dev storage functions ---

function getEventsDataLocal(): EventsData {
	const { eventsFile } = getLocalPaths();
	try {
		if (existsSync(eventsFile)) {
			const content = readFileSync(eventsFile, 'utf-8');
			return JSON.parse(content) as EventsData;
		}
	} catch (err) {
		console.error('[dev] Error reading local events:', err);
	}
	return { updatedAt: new Date().toISOString(), events: [] };
}

function saveEventsDataLocal(data: EventsData): void {
	const { dataDir, eventsFile } = getLocalPaths();
	data.updatedAt = new Date().toISOString();
	console.log(`[dev] Saving to: ${eventsFile}`);
	if (!existsSync(dataDir)) {
		mkdirSync(dataDir, { recursive: true });
	}
	writeFileSync(eventsFile, JSON.stringify(data, null, '\t'), 'utf-8');
	console.log(`[dev] Saved ${data.events.length} events`);
}

async function savePosterLocal(id: string, poster: File): Promise<string> {
	const { postersDir } = getLocalPaths();
	if (!existsSync(postersDir)) {
		mkdirSync(postersDir, { recursive: true });
	}
	const ext = poster.name.split('.').pop()?.toLowerCase() || 'jpg';
	const filename = `${id}.${ext}`;
	const buffer = Buffer.from(await poster.arrayBuffer());
	writeFileSync(join(postersDir, filename), buffer);
	return `/data/posters/${filename}`;
}

// --- Shared validation & event building ---

function parseAndValidateForm(formData: FormData): {
	error?: string;
	fields?: {
		title: string;
		type: CommunityEvent['type'];
		startDate: string;
		startTime: string;
		endDate: string;
		endTime: string;
		venue: string;
		description: string;
		rsvpUrl: string;
		websiteUrl: string;
		mapsUrl: string;
		organizer: string;
		poster: File | null;
	};
} {
	// Honeypot check
	if (formData.get('website_url_confirm')) {
		return { error: 'spam' };
	}

	const title = (formData.get('title') as string || '').trim();
	const type = (formData.get('type') as string || 'Other') as CommunityEvent['type'];
	const startDate = formData.get('startDate') as string || '';
	const startTime = formData.get('startTime') as string || '';
	const endDate = formData.get('endDate') as string || '';
	const endTime = formData.get('endTime') as string || '';
	const venue = (formData.get('venue') as string || '').trim();
	const mapsUrl = (formData.get('mapsUrl') as string || '').trim();
	const description = (formData.get('description') as string || '').trim();
	const rsvpUrl = (formData.get('rsvpUrl') as string || '').trim();
	const websiteUrl = (formData.get('websiteUrl') as string || '').trim();
	const organizer = (formData.get('organizer') as string || '').trim();
	const poster = formData.get('poster') as File | null;

	if (!title || !startDate || !startTime || !venue || !organizer) {
		return { error: 'Missing required fields' };
	}

	if (!['Walk', 'Cycle', 'Other'].includes(type)) {
		return { error: 'Invalid event type' };
	}

	if (poster && poster.size > 0) {
		if (poster.size > 2 * 1024 * 1024) {
			return { error: 'Poster must be under 2 MB' };
		}
		if (!poster.type.startsWith('image/')) {
			return { error: 'Poster must be an image' };
		}
	}

	return {
		fields: { title, type, startDate, startTime, endDate, endTime, venue, mapsUrl, description, rsvpUrl, websiteUrl, organizer, poster }
	};
}

function jsonResponse(body: object, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

export const POST: RequestHandler = async (event) => {
	const r2 = dev ? null : getR2Bucket(event);
	const isLocal = dev;

	if (!r2 && !isLocal) {
		return jsonResponse({ success: false, error: 'Storage not available' }, 503);
	}

	try {
		const formData = await event.request.formData();
		const parsed = parseAndValidateForm(formData);

		if (parsed.error === 'spam') {
			return jsonResponse({ success: true });
		}
		if (parsed.error) {
			return jsonResponse({ success: false, error: parsed.error }, 400);
		}

		const { fields } = parsed;
		if (!fields) return jsonResponse({ success: false, error: 'Unexpected error' }, 500);

		const id = generateEventId();

		// Build ISO date strings with IST offset
		const startISO = `${fields.startDate}T${fields.startTime}:00+05:30`;
		const endISO = fields.endDate && fields.endTime
			? `${fields.endDate}T${fields.endTime}:00+05:30`
			: fields.endTime
				? `${fields.startDate}T${fields.endTime}:00+05:30`
				: startISO;

		// Upload poster
		let posterUrl = '';
		const poster = fields.poster;
		if (poster && poster.size > 0) {
			if (isLocal) {
				posterUrl = await savePosterLocal(id, poster);
			} else {
				const ext = poster.name.split('.').pop()?.toLowerCase() || 'jpg';
				const posterKey = `${POSTERS_PREFIX}${id}.${ext}`;
				const arrayBuffer = await poster.arrayBuffer();
				await r2!.put(posterKey, arrayBuffer, {
					httpMetadata: { contentType: poster.type }
				});
				posterUrl = `https://assets.hejjegala.in/${posterKey}`;
			}
		}

		const newEvent: CommunityEvent = {
			id,
			title: fields.title,
			description: fields.description,
			type: fields.type,
			startDate: startISO,
			endDate: endISO,
			venue: fields.venue,
			rsvpUrl: fields.rsvpUrl,
			websiteUrl: fields.websiteUrl,
			mapsUrl: fields.mapsUrl,
			posterUrl,
			organizer: fields.organizer
		};

		// Read existing events, append, save
		if (isLocal) {
			const eventsData = getEventsDataLocal();
			eventsData.events.push(newEvent);
			saveEventsDataLocal(eventsData);
		} else {
			const eventsData = await getEventsDataR2(r2!);
			eventsData.events.push(newEvent);
			await saveEventsDataR2(r2!, eventsData);
		}

		return jsonResponse({ success: true, event: newEvent }, 201);
	} catch (err) {
		console.error('Error creating event:', err);
		return jsonResponse({ success: false, error: 'Failed to create event' }, 500);
	}
};
