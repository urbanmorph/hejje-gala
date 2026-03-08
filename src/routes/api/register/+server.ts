import type { RequestHandler, RequestEvent } from '@sveltejs/kit';
import {
	ALTMO_DOMAIN,
	ALTMO_API_KEY,
	ALTMO_CHALLENGE_ID,
	ALTMO_CITY_ID
} from '$env/static/private';

const ALTMO_BASE_URL = `https://${ALTMO_DOMAIN}/api/v1`;
const ACCESS_TOKEN = ALTMO_API_KEY;
const CHALLENGE_ID = ALTMO_CHALLENGE_ID;

type RegisterRequest = {
	organisationName: string;
	representativeName: string;
	representativeEmail: string;
	representativeDesignation?: string;
	representativePhone?: string;
	numberOfEmployees?: string;
	selectedLocation?: { lng: number; lat: number } | null;
	isNewOrganisation: boolean;
	selectedCompanyId?: number;
};

type AltmoRegisterResponse = {
	success: boolean;
	message?: string;
	user?: {
		id: number;
		name: string;
		email: string;
		profileDetailsAdded: boolean;
		companyDetailsAdded: boolean;
		skippedOrganisationDetails: boolean;
		connectedToStrava: boolean;
		confirmedAt: string;
	};
	company?: {
		company: {
			id: number;
			name: string;
			address: string;
			empCount: number;
			statistics: {
				employeeCount: number;
				activitiesCount: number;
				distance: number;
				co2Offset: number;
				fuelSaved: number;
				moneySaved: number;
			};
		};
	};
	challenge?: {
		id: number;
		name: string;
		startDate: string;
		endDate: string;
		challengeScope: string;
		description: string;
		shortDescription: string;
		status: string;
		challengeType: string | null;
		acceptedActivityTypes: number[];
	};
	error?: string;
};

// Helper function to escape CSV values
function escapeCsvValue(value: string | null | undefined): string {
	if (value === null || value === undefined) {
		return '';
	}
	const str = String(value);
	// If value contains comma, quote, or newline, wrap in quotes and escape quotes
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

// Helper function to get R2 bucket
function getR2Bucket(event: RequestEvent) {
	return event.platform?.env?.GALA_ASSETS || null;
}

// Helper function to append registration to CSV
async function appendRegistrationToCsv(event: RequestEvent, body: RegisterRequest): Promise<void> {
	const r2Bucket = getR2Bucket(event);
	if (!r2Bucket) {
		console.warn('R2 bucket not available, skipping CSV logging');
		return;
	}

	const csvPath = 'files/registrations.csv';

	try {
		// Try to get existing file
		let existingContent = '';
		let hasHeader = false;

		try {
			const existingFile = await r2Bucket.get(csvPath);
			if (existingFile) {
				existingContent = await existingFile.text();
				hasHeader = existingContent.trim().length > 0;
			}
		} catch (error) {
			// File doesn't exist yet, that's okay
			console.log('CSV file does not exist, will create new one');
		}

		// Prepare CSV row
		const locationStr = body.selectedLocation
			? `${body.selectedLocation.lat},${body.selectedLocation.lng}`
			: '';

		const csvRow = [
			escapeCsvValue(body.organisationName),
			escapeCsvValue(locationStr),
			escapeCsvValue(body.representativeName),
			escapeCsvValue(body.representativeDesignation),
			escapeCsvValue(body.representativeEmail),
			escapeCsvValue(body.representativePhone),
			escapeCsvValue(body.numberOfEmployees)
		].join(',');

		// Build CSV content
		let csvContent = '';
		if (!hasHeader) {
			// Add header row
			csvContent =
				'Organisation Name,Selected Location,Representative Name,Representative Designation,Representative E-Mail,Representative Phone,Number of Employees\n';
		}

		// Append existing content (if any) and new row
		if (existingContent.trim()) {
			csvContent = existingContent.trim() + '\n' + csvRow;
		} else {
			csvContent += csvRow;
		}

		// Write to R2
		const putResult = await r2Bucket.put(csvPath, csvContent, {
			httpMetadata: {
				contentType: 'text/csv'
			}
		});

		console.log('Registration details appended to CSV successfully');
		console.log('R2 put operation result:', {
			key: putResult.key,
			version: putResult.version,
			etag: putResult.etag,
			uploaded: putResult.uploaded,
			httpEtag: putResult.httpEtag,
			size: putResult.size,
			customMetadata: putResult.customMetadata,
			httpMetadata: putResult.httpMetadata
		});
	} catch (error) {
		// Log error but don't fail the registration
		console.error('Error writing to CSV:', error);
	}
}

export const POST: RequestHandler = async (event) => {
	const { request } = event;
	let body: RegisterRequest;
	let registrationError: Error | null = null;
	let registrationResponse: Response | null = null;

	try {
		body = (await request.json()) as RegisterRequest;
	} catch (error) {
		console.error('Error parsing request body', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Invalid request body'
			}),
			{
				status: 400,
				headers: {
					'content-type': 'application/json',
					'cache-control': 'no-store'
				}
			}
		);
	}

	// Try to register with the API
	try {
		// Build the JSON body for the API
		// Include user fields: email, name, designation, phone
		// Include company fields: id, name, emp_count, geo_markers
		const requestBody: Record<string, any> = {
			user: {
				email: String(body.representativeEmail),
				name: String(body.representativeName)
			}
		};

		// Add designation if provided
		if (body.representativeDesignation) {
			requestBody.user.designation = String(body.representativeDesignation);
		}

		// Add phone if provided (with +91 prefix)
		if (body.representativePhone) {
			requestBody.user.phone = `+91${body.representativePhone}`;
		}

		// Handle company data - only essential fields
		if (body.isNewOrganisation) {
			// New company - include name, emp_count, and geo_markers
			requestBody.company = {};
			requestBody.company.address = String('Bengaluru');
			requestBody.company.updated_city_id = parseInt(ALTMO_CITY_ID, 10);
			requestBody.company.updated_state_id = 1204;
			requestBody.company.updated_country_id = 105;
			if (body.organisationName) {
				requestBody.company.name = String(body.organisationName);
			}
			if (body.numberOfEmployees) {
				// emp_count must be an Integer
				const empCount = parseInt(body.numberOfEmployees, 10);
				if (!isNaN(empCount)) {
					requestBody.company.emp_count = empCount;
				}
			}
			if (body.selectedLocation) {
				// geo_markers must be Floats
				requestBody.company.geo_markers = {
					lat: body.selectedLocation.lat,
					lon: body.selectedLocation.lng
				};
			}
		} else if (body.selectedCompanyId) {
			// Existing company - only include company[id] as Integer
			requestBody.company = {
				id: body.selectedCompanyId
			};
		}

		// Build URL with access_token as query parameter
		const url = `${ALTMO_BASE_URL}/challenges/${CHALLENGE_ID}/register?access_token=${ACCESS_TOKEN}`;

		const upstreamResponse = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				accept: 'application/json'
			},
			body: JSON.stringify(requestBody)
		});

		if (!upstreamResponse.ok) {
			const errorData = await upstreamResponse.json().catch(() => ({}));
			registrationResponse = new Response(
				JSON.stringify({
					success: false,
					error: errorData.error || `Failed to register (${upstreamResponse.status})`
				}),
				{
					status: upstreamResponse.status,
					headers: {
						'content-type': 'application/json',
						'cache-control': 'no-store'
					}
				}
			);
		} else {
			const data = (await upstreamResponse.json()) as AltmoRegisterResponse;
			registrationResponse = new Response(JSON.stringify(data), {
				status: 200,
				headers: {
					'content-type': 'application/json',
					'cache-control': 'no-store'
				}
			});
		}
	} catch (error) {
		console.error('Error registering with Altmo API', error);
		registrationError = error instanceof Error ? error : new Error(String(error));
		registrationResponse = new Response(
			JSON.stringify({
				success: false,
				error: 'Unexpected error while registering'
			}),
			{
				status: 500,
				headers: {
					'content-type': 'application/json',
					'cache-control': 'no-store'
				}
			}
		);
	}

	// Always append registration details to CSV file in R2 bucket, even if API call failed
	// Do this asynchronously but await it to ensure it completes
	try {
		await appendRegistrationToCsv(event, body);
	} catch (error) {
		// Log error but don't fail the response
		console.error('Error appending to CSV (non-fatal):', error);
	}

	// Return the registration response (success or error)
	return registrationResponse;
};
