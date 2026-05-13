import type { RequestHandler } from '@sveltejs/kit';
import {
	buildEvent,
	buildEventDates,
	deletePhoto,
	jsonResponse,
	parseEventForm,
	readEvents,
	requireAdmin,
	uploadPhoto,
	writeEvents
} from '$lib/server/events';

export const PUT: RequestHandler = async (event) => {
	const blocked = requireAdmin(event);
	if (blocked) return blocked;

	const { id } = event.params;
	if (!id) return jsonResponse({ success: false, error: 'Missing id' }, 400);

	try {
		const formData = await event.request.formData();
		const parsed = parseEventForm(formData, { allowRecap: true, honeypotCheck: false });
		if ('error' in parsed) return jsonResponse({ success: false, error: parsed.error }, 400);
		if ('spam' in parsed) return jsonResponse({ success: false, error: 'Unexpected' }, 400);

		const { fields } = parsed;
		const dates = buildEventDates(
			fields.startDate,
			fields.startTime,
			fields.endDate,
			fields.endTime
		);
		if ('error' in dates) return jsonResponse({ success: false, error: dates.error }, 400);

		const data = await readEvents(event);
		const idx = data.events.findIndex((e) => e.id === id);
		if (idx === -1) return jsonResponse({ success: false, error: 'Event not found' }, 404);
		const existing = data.events[idx];

		const posterUrl = await resolvePhoto({
			event,
			id,
			kind: 'poster',
			incoming: fields.poster,
			clearFlag: formData.get('clearPoster') === '1',
			existingUrl: existing.posterUrl
		});

		const recapPhotoUrl = await resolvePhoto({
			event,
			id,
			kind: 'recap',
			incoming: fields.recapPhoto ?? null,
			clearFlag: formData.get('clearRecapPhoto') === '1',
			existingUrl: existing.recapPhotoUrl
		});

		data.events[idx] = buildEvent({
			id,
			fields,
			...dates,
			posterUrl,
			recapPhotoUrl
		});

		await writeEvents(event, data);
		return jsonResponse({ success: true, event: data.events[idx] });
	} catch (err) {
		console.error('Error updating event:', err);
		return jsonResponse({ success: false, error: 'Failed to update event' }, 500);
	}
};

export const DELETE: RequestHandler = async (event) => {
	const blocked = requireAdmin(event);
	if (blocked) return blocked;

	const { id } = event.params;
	if (!id) return jsonResponse({ success: false, error: 'Missing id' }, 400);

	try {
		const data = await readEvents(event);
		const idx = data.events.findIndex((e) => e.id === id);
		if (idx === -1) return jsonResponse({ success: false, error: 'Event not found' }, 404);

		const target = data.events[idx];
		await deletePhoto(event, target.posterUrl);
		await deletePhoto(event, target.recapPhotoUrl);

		data.events.splice(idx, 1);
		await writeEvents(event, data);

		return jsonResponse({ success: true });
	} catch (err) {
		console.error('Error deleting event:', err);
		return jsonResponse({ success: false, error: 'Failed to delete event' }, 500);
	}
};

async function resolvePhoto(args: {
	event: Parameters<RequestHandler>[0];
	id: string;
	kind: 'poster' | 'recap';
	incoming: File | null;
	clearFlag: boolean;
	existingUrl: string | undefined;
}): Promise<string | undefined> {
	const { event, id, kind, incoming, clearFlag, existingUrl } = args;
	if (incoming && incoming.size > 0) {
		await deletePhoto(event, existingUrl);
		return uploadPhoto(event, id, incoming, kind);
	}
	if (clearFlag) {
		await deletePhoto(event, existingUrl);
		return undefined;
	}
	return existingUrl;
}
