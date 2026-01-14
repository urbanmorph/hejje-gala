import type { RequestHandler } from '@sveltejs/kit';
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

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as RegisterRequest;

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

		console.log('Registration URL:', url);
		console.log('Registration Body:', JSON.stringify(requestBody, null, 2));

		// Log the curl request equivalent
		console.log(
			`curl -X POST '${url}' -H 'Content-Type: application/json' -d '${JSON.stringify(requestBody)}'`
		);

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
			return new Response(
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
		}

		const data = (await upstreamResponse.json()) as AltmoRegisterResponse;

		return new Response(JSON.stringify(data), {
			status: 200,
			headers: {
				'content-type': 'application/json',
				'cache-control': 'no-store'
			}
		});
	} catch (error) {
		console.error('Error registering with Altmo API', error);
		return new Response(
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
};
