import type { RequestHandler } from '@sveltejs/kit';
import {
	buildEvent,
	buildEventDates,
	generateEventId,
	jsonResponse,
	parseEventForm,
	readEvents,
	requireAdmin,
	uploadPhoto,
	writeEvents
} from '$lib/server/events';

export const GET: RequestHandler = async (event) => {
	const blocked = requireAdmin(event);
	if (blocked) return blocked;

	try {
		const data = await readEvents(event);
		return jsonResponse({ success: true, ...data });
	} catch (err) {
		console.error('Error reading events:', err);
		return jsonResponse({ success: false, error: 'Failed to read events' }, 500);
	}
};

export const POST: RequestHandler = async (event) => {
	const blocked = requireAdmin(event);
	if (blocked) return blocked;

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

		const id = generateEventId();
		const posterUrl =
			fields.poster && fields.poster.size > 0
				? await uploadPhoto(event, id, fields.poster, 'poster')
				: '';
		const recapPhotoUrl =
			fields.recapPhoto && fields.recapPhoto.size > 0
				? await uploadPhoto(event, id, fields.recapPhoto, 'recap')
				: '';

		const newEvent = buildEvent({ id, fields, ...dates, posterUrl, recapPhotoUrl });

		const data = await readEvents(event);
		data.events.push(newEvent);
		await writeEvents(event, data);

		return jsonResponse({ success: true, event: newEvent }, 201);
	} catch (err) {
		console.error('Error creating event (admin):', err);
		return jsonResponse({ success: false, error: 'Failed to create event' }, 500);
	}
};
