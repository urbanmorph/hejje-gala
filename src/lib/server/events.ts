import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import type { CommunityEvent, EventsData } from '$lib/types/event';

export const EVENTS_PATH = 'events/events.json';
export const POSTERS_PREFIX = 'events/posters/';
export const RECAP_PHOTOS_PREFIX = 'events/recap-photos/';
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const PUBLIC_ASSETS_BASE = 'https://assets.hejjegala.in';

export type PhotoKind = 'poster' | 'recap';

const KIND_PREFIX: Record<PhotoKind, string> = {
	poster: POSTERS_PREFIX,
	recap: RECAP_PHOTOS_PREFIX
};

const KIND_LOCAL_DIR: Record<PhotoKind, string> = {
	poster: 'posters',
	recap: 'recap-photos'
};

export function getR2(event: RequestEvent): R2Bucket | null {
	return event.platform?.env?.GALA_ASSETS || null;
}

export function generateEventId(): string {
	const ts = Date.now().toString(36);
	const rand = Math.random().toString(36).slice(2, 6);
	return `evt-${ts}-${rand}`;
}

export function jsonResponse(body: object, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
	});
}

// --- token auth ---

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return result === 0;
}

export function isValidAdminToken(token: string | null | undefined): boolean {
	const expected = env.ADMIN_EVENTS_TOKEN;
	if (!token || !expected) return false;
	return timingSafeEqual(token, expected);
}

export function bearerFromHeaders(headers: Headers): string | null {
	const auth = headers.get('authorization') || '';
	const match = auth.match(/^Bearer\s+(.+)$/i);
	return match ? match[1].trim() : null;
}

// --- events.json storage ---

async function localPaths() {
	const { join } = await import('node:path');
	const root = process.cwd();
	const dataDir = join(root, 'static', 'data');
	return {
		dataDir,
		eventsFile: join(dataDir, 'sample-events.json'),
		photoDir: (kind: PhotoKind) => join(dataDir, KIND_LOCAL_DIR[kind])
	};
}

export async function readEvents(event: RequestEvent): Promise<EventsData> {
	if (dev) {
		const { readFileSync, existsSync } = await import('node:fs');
		const { eventsFile } = await localPaths();
		try {
			if (existsSync(eventsFile)) {
				return JSON.parse(readFileSync(eventsFile, 'utf-8')) as EventsData;
			}
		} catch (err) {
			console.error('[dev] Error reading local events:', err);
		}
		return { updatedAt: new Date().toISOString(), events: [] };
	}
	const r2 = getR2(event);
	if (!r2) throw new Error('Storage not available');
	try {
		const file = await r2.get(EVENTS_PATH);
		if (file) return (await file.json()) as EventsData;
	} catch {
		// First write
	}
	return { updatedAt: new Date().toISOString(), events: [] };
}

export async function writeEvents(event: RequestEvent, data: EventsData): Promise<void> {
	data.updatedAt = new Date().toISOString();
	const json = JSON.stringify(data, null, '\t');
	if (dev) {
		const { writeFileSync, mkdirSync, existsSync } = await import('node:fs');
		const { dataDir, eventsFile } = await localPaths();
		if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
		writeFileSync(eventsFile, json, 'utf-8');
		return;
	}
	const r2 = getR2(event);
	if (!r2) throw new Error('Storage not available');
	await r2.put(EVENTS_PATH, json, { httpMetadata: { contentType: 'application/json' } });
}

// --- photo storage ---

export function validatePhoto(file: File | null): string | null {
	if (!file || file.size === 0) return null;
	if (file.size > MAX_PHOTO_BYTES) return 'Image must be under 2 MB';
	if (!file.type.startsWith('image/')) return 'File must be an image';
	return null;
}

export async function uploadPhoto(
	event: RequestEvent,
	id: string,
	file: File,
	kind: PhotoKind
): Promise<string> {
	const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
	if (dev) {
		const { writeFileSync, mkdirSync, existsSync } = await import('node:fs');
		const { join } = await import('node:path');
		const paths = await localPaths();
		const dir = paths.photoDir(kind);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
		const filename = `${id}.${ext}`;
		const buffer = Buffer.from(await file.arrayBuffer());
		writeFileSync(join(dir, filename), buffer);
		return `/data/${KIND_LOCAL_DIR[kind]}/${filename}`;
	}
	const r2 = getR2(event);
	if (!r2) throw new Error('Storage not available');
	const key = `${KIND_PREFIX[kind]}${id}.${ext}`;
	await r2.put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});
	return `${PUBLIC_ASSETS_BASE}/${key}`;
}

export async function deletePhoto(
	event: RequestEvent,
	photoUrl: string | undefined
): Promise<void> {
	if (!photoUrl) return;
	if (dev) {
		try {
			const { unlinkSync, existsSync } = await import('node:fs');
			const { join } = await import('node:path');
			const root = process.cwd();
			const localPath = join(root, 'static', photoUrl.replace(/^\//, ''));
			if (existsSync(localPath)) unlinkSync(localPath);
		} catch (err) {
			console.error('[dev] Error deleting photo:', err);
		}
		return;
	}
	const r2 = getR2(event);
	if (!r2) return;
	if (!photoUrl.startsWith(`${PUBLIC_ASSETS_BASE}/`)) return;
	const key = photoUrl.slice(PUBLIC_ASSETS_BASE.length + 1);
	try {
		await r2.delete(key);
	} catch (err) {
		console.error('Error deleting from R2:', err);
	}
}

// --- form parsing ---

export interface EventFormFields {
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
	recapDescription?: string;
	recapPhoto?: File | null;
}

export type ParseResult = { error: string } | { spam: true } | { fields: EventFormFields };

export function parseEventForm(
	formData: FormData,
	options: { allowRecap?: boolean; honeypotCheck?: boolean } = {}
): ParseResult {
	const { allowRecap = false, honeypotCheck = true } = options;

	if (honeypotCheck && formData.get('website_url_confirm')) return { spam: true };

	const str = (key: string) => (formData.get(key) as string | null) ?? '';
	const title = str('title').trim();
	const type = (str('type') || 'Other') as CommunityEvent['type'];
	const startDate = str('startDate');
	const startTime = str('startTime');
	const endDate = str('endDate');
	const endTime = str('endTime');
	const venue = str('venue').trim();
	const mapsUrl = str('mapsUrl').trim();
	const description = str('description').trim();
	const rsvpUrl = str('rsvpUrl').trim();
	const websiteUrl = str('websiteUrl').trim();
	const organizer = str('organizer').trim();
	const poster = formData.get('poster') as File | null;

	if (!title || !startDate || !startTime || !venue || !organizer) {
		return { error: 'Missing required fields' };
	}
	if (!['Walk', 'Cycle', 'Other'].includes(type)) {
		return { error: 'Invalid event type' };
	}

	const posterError = validatePhoto(poster);
	if (posterError) return { error: posterError };

	const fields: EventFormFields = {
		title,
		type,
		startDate,
		startTime,
		endDate,
		endTime,
		venue,
		description,
		rsvpUrl,
		websiteUrl,
		mapsUrl,
		organizer,
		poster
	};

	if (allowRecap) {
		const recapPhoto = formData.get('recapPhoto') as File | null;
		const recapError = validatePhoto(recapPhoto);
		if (recapError) return { error: recapError };
		fields.recapDescription = str('recapDescription').trim();
		fields.recapPhoto = recapPhoto;
	}

	return { fields };
}

export function buildEventDates(
	startDate: string,
	startTime: string,
	endDate: string,
	endTime: string
): { startISO: string; endISO: string } | { error: string } {
	const startISO = `${startDate}T${startTime}:00+05:30`;
	const endISO =
		endDate && endTime
			? `${endDate}T${endTime}:00+05:30`
			: endTime
				? `${startDate}T${endTime}:00+05:30`
				: startISO;
	if (new Date(endISO) < new Date(startISO)) {
		return { error: 'End date/time must be after start date/time' };
	}
	return { startISO, endISO };
}

export interface BuildEventInput {
	id: string;
	fields: EventFormFields;
	startISO: string;
	endISO: string;
	posterUrl?: string;
	recapPhotoUrl?: string;
}

export function buildEvent({
	id,
	fields,
	startISO,
	endISO,
	posterUrl,
	recapPhotoUrl
}: BuildEventInput): CommunityEvent {
	return {
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
		posterUrl: posterUrl ?? '',
		organizer: fields.organizer,
		recapDescription: fields.recapDescription?.trim() || undefined,
		recapPhotoUrl: recapPhotoUrl || undefined
	};
}

export function requireAdmin(event: RequestEvent): Response | null {
	const token = bearerFromHeaders(event.request.headers);
	if (!isValidAdminToken(token)) return jsonResponse({ success: false, error: 'Not found' }, 404);
	return null;
}
