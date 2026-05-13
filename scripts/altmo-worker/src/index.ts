// Hejje Gala leaderboard refresh worker.
// Fetches challenge data from Altmo API and writes leaderboard JSONs to R2.
// Runs on Cloudflare's cron trigger (see wrangler.toml).

interface Env {
	GALA_ASSETS: R2Bucket;
	ALTMO_DOMAIN: string;
	ALTMO_API_KEY: string;
	ALTMO_CHALLENGE_ID: string;
	ALTMO_CITY_ID: string;
	DEFAULT_CITY: string;
}

const CORPORATION_MAPPING: Record<string, string> = {
	'GBA Central': 'central',
	'GBA East': 'east',
	'GBA North': 'north',
	'GBA South': 'south',
	'GBA West': 'west',
	ELCITA: 'elcita',
	'Bangalore Urban': 'blr-urban',
	'Bangalore Rural': 'blr-rural'
};

const DIMENSIONS = [
	'recreationAll',
	'recreationWalk',
	'recreationCycle',
	'commuteAll',
	'commuteWalk',
	'commuteCycle',
	'transitAll',
	'transitWalk',
	'transitCycle'
] as const;

type Dimension = (typeof DIMENSIONS)[number];

const SCORE_WEIGHTS = { activities: 0.5, co2Offset: 0.3, fuelSaved: 0.1, moneySaved: 0.1 };

// ============================================================================
// Types
// ============================================================================

type ActivityAttr = {
	type?: string;
	activityType?: string;
	distance?: number;
	co2Offset?: number;
	fuelSaved?: number;
	moneySaved?: number;
	commutableName?: string;
	companyName?: string;
};

type RawActivity = {
	attributes?: ActivityAttr;
	relationships?: { user?: { data?: { id?: string | number } } };
};

type ChildEntity = {
	name?: string;
	participants?: number;
	activities_count?: number;
};

type LeaderboardEntry = {
	name?: string;
	activities_count?: number;
	participants?: number;
	co2_offset?: number;
	fuel_saved?: number;
	distance?: number;
	money_saved?: number;
	child_entities?: ChildEntity[];
};

type ChallengeResponse = {
	activities?: RawActivity[];
	leaderboard?: LeaderboardEntry[];
};

type CompanyBucket = {
	activities: number;
	participantIds: Set<string>;
	co2Offset: number;
	fuelSaved: number;
	moneySaved: number;
};

type Aggregation = Record<Dimension, Record<string, Record<string, CompanyBucket>>>;

type CompanyRow = {
	rank: number;
	companyId: string;
	name: string;
	activities: number;
	co2OffsetKg: number;
	fuelSavedL: number;
	moneySaved: number;
	employees: number;
	score: number;
	sector: string;
	location: string;
	description: string;
	metrics: { label: string; value: string }[];
};

type CorpRow = {
	rank: number;
	corporationId: string;
	name: string;
	activities: number;
	co2OffsetKg: number;
	fuelSavedL: number;
	moneySaved: number;
	companies: number;
	employees: number;
	score: number;
};

// ============================================================================
// Helpers
// ============================================================================

function getActivityType(activity: RawActivity): 'recreation' | 'commute' | 'transit' {
	const t = activity.attributes?.type ?? '';
	if (t.includes('Recreational')) return 'recreation';
	if (t.includes('Transit')) return 'transit';
	return 'commute';
}

function getActivityMode(activity: RawActivity): 'walk' | 'cycle' | 'all' {
	const m = (activity.attributes?.activityType ?? '').toLowerCase();
	if (m === 'walk') return 'walk';
	if (m === 'cycle' || m === 'cycling') return 'cycle';
	return 'all';
}

function getDimensionsFor(type: string, mode: string): Dimension[] {
	const dims: Dimension[] = [`${type}All` as Dimension];
	if (mode !== 'all') {
		dims.push(`${type}${mode.charAt(0).toUpperCase()}${mode.slice(1)}` as Dimension);
	}
	return dims;
}

function calculateScore(
	dimension: string,
	activities: number,
	employees: number,
	co2Offset = 0,
	fuelSaved = 0,
	moneySaved = 0
): number {
	if (dimension.startsWith('recreation')) {
		return activities * employees;
	}
	return (
		activities * SCORE_WEIGHTS.activities +
		co2Offset * SCORE_WEIGHTS.co2Offset +
		fuelSaved * SCORE_WEIGHTS.fuelSaved +
		moneySaved * SCORE_WEIGHTS.moneySaved
	);
}

function rankEntries<T extends { score?: number; rank: number; name?: string; employees?: number }>(
	entries: T[]
): void {
	entries.sort((a, b) => {
		const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
		if (scoreDiff !== 0) return scoreDiff;
		return (b.employees ?? 0) - (a.employees ?? 0);
	});
	entries.forEach((e, i) => {
		e.rank = i + 1;
	});
}

function getCompanyId(companyName: string): string {
	return `unknown-${companyName.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')}`;
}

// ============================================================================
// API fetch
// ============================================================================

async function fetchChallengeData(env: Env): Promise<ChallengeResponse> {
	const url = `https://${env.ALTMO_DOMAIN}/api/v1/challenges/${env.ALTMO_CHALLENGE_ID}?access_token=${env.ALTMO_API_KEY}`;
	const res = await fetch(url, { headers: { accept: 'application/json' } });
	if (!res.ok) {
		throw new Error(`Altmo API returned ${res.status}`);
	}
	return (await res.json()) as ChallengeResponse;
}

async function fetchOverallStats(env: Env): Promise<unknown> {
	const url = `https://${env.ALTMO_DOMAIN}/api/v1/statistics/overall?access_token=${env.ALTMO_API_KEY}`;
	const res = await fetch(url, { headers: { accept: 'application/json' } });
	if (!res.ok) throw new Error(`Overall stats API returned ${res.status}`);
	const data = (await res.json()) as { overall_statistics?: unknown };
	return { success: true, overall_statistics: data.overall_statistics ?? {} };
}

// ============================================================================
// Aggregation
// ============================================================================

function buildCompanyToCorp(leaderboard: LeaderboardEntry[]): Record<string, string> {
	const map: Record<string, string> = {};
	for (const entry of leaderboard) {
		const corp = entry.name ?? '';
		for (const child of entry.child_entities ?? []) {
			if (child.name) map[child.name] = corp;
		}
	}
	return map;
}

function getCompanyAndCorp(
	attr: ActivityAttr,
	companyToCorp: Record<string, string>
): { company: string | null; corp: string | null } {
	const company = attr.commutableName || attr.companyName || null;
	if (!company || company === 'unavailable') return { company: null, corp: null };
	let corp = companyToCorp[company] ?? null;
	if (!corp) {
		for (const corpName of Object.keys(CORPORATION_MAPPING)) {
			if (company.toLowerCase().includes(corpName.toLowerCase())) {
				corp = corpName;
				break;
			}
		}
	}
	return corp ? { company, corp } : { company: null, corp: null };
}

function newBucket(): CompanyBucket {
	return {
		activities: 0,
		participantIds: new Set(),
		co2Offset: 0,
		fuelSaved: 0,
		moneySaved: 0
	};
}

function aggregate(data: ChallengeResponse): Aggregation {
	const activities = data.activities ?? [];
	const leaderboard = data.leaderboard ?? [];
	const companyToCorp = buildCompanyToCorp(leaderboard);

	const agg = {} as Aggregation;
	for (const dim of DIMENSIONS) agg[dim] = {};

	// Pre-populate all companies from leaderboard so zero-activity orgs still appear.
	for (const [company, corp] of Object.entries(companyToCorp)) {
		if (!corp) continue;
		for (const dim of DIMENSIONS) {
			agg[dim][corp] ??= {};
			agg[dim][corp][company] ??= newBucket();
		}
	}

	for (const activity of activities) {
		const attr = activity.attributes ?? {};
		if (!attr.distance || attr.distance === 0) continue;

		const type = getActivityType(activity);
		const mode = getActivityMode(activity);
		const dims = getDimensionsFor(type, mode);
		const { company, corp } = getCompanyAndCorp(attr, companyToCorp);
		if (!company || !corp) continue;

		const userId = activity.relationships?.user?.data?.id;
		const metrics = {
			distanceKm: (attr.distance ?? 0) / 1000,
			co2Offset: attr.co2Offset ?? 0,
			fuelSaved: attr.fuelSaved ?? 0,
			moneySaved: attr.moneySaved ?? 0
		};

		for (const dim of dims) {
			agg[dim][corp] ??= {};
			agg[dim][corp][company] ??= newBucket();
			const bucket = agg[dim][corp][company];
			bucket.activities += 1;
			if (userId != null) bucket.participantIds.add(String(userId));
			bucket.co2Offset += metrics.co2Offset;
			bucket.fuelSaved += metrics.fuelSaved;
			bucket.moneySaved += metrics.moneySaved;
		}
	}

	return agg;
}

// ============================================================================
// JSON generation
// ============================================================================

type LeaderboardState = {
	companyParticipants: Record<string, number>;
	companyTotalActivities: Record<string, number>;
	corpData: Record<
		string,
		{
			activities_count: number;
			participants: number;
			co2_offset: number;
			fuel_saved: number;
			distance: number;
			money_saved: number;
			companies: number;
		}
	>;
};

function extractLeaderboardState(leaderboard: LeaderboardEntry[]): LeaderboardState {
	const state: LeaderboardState = {
		companyParticipants: {},
		companyTotalActivities: {},
		corpData: {}
	};
	for (const entry of leaderboard) {
		const corpName = entry.name ?? '';
		if (corpName) {
			state.corpData[corpName] = {
				activities_count: entry.activities_count ?? 0,
				participants: entry.participants ?? 0,
				co2_offset: entry.co2_offset ?? 0,
				fuel_saved: entry.fuel_saved ?? 0,
				distance: entry.distance ?? 0,
				money_saved: entry.money_saved ?? 0,
				companies: (entry.child_entities ?? []).length
			};
		}
		for (const child of entry.child_entities ?? []) {
			if (!child.name) continue;
			if (child.participants != null) {
				state.companyParticipants[child.name] = child.participants;
			}
			if (child.activities_count != null) {
				state.companyTotalActivities[child.name] = child.activities_count;
			}
		}
	}
	return state;
}

function createCompanyEntry(
	companyName: string,
	bucket: CompanyBucket,
	dimension: string,
	corporationName: string,
	state: LeaderboardState
): CompanyRow {
	const activeUsersCount = bucket.participantIds.size;
	const participantsCount = state.companyParticipants[companyName] ?? activeUsersCount;
	const score = calculateScore(
		dimension,
		bucket.activities,
		participantsCount,
		bucket.co2Offset,
		bucket.fuelSaved,
		bucket.moneySaved
	);

	return {
		rank: 0,
		companyId: getCompanyId(companyName),
		name: companyName,
		activities: bucket.activities,
		co2OffsetKg: round(bucket.co2Offset, 2),
		fuelSavedL: round(bucket.fuelSaved, 2),
		moneySaved: round(bucket.moneySaved, 2),
		employees: participantsCount,
		score: round(score, 2),
		sector: 'Corporate offices',
		location: corporationName,
		description: `Company participating in ${corporationName} challenge.`,
		metrics: [
			{ label: 'Active users', value: String(participantsCount) },
			{ label: 'Average weekly activities', value: String(bucket.activities) },
			{ label: 'CO₂ offset', value: `${round(bucket.co2Offset, 2)} kg` },
			{ label: 'Fuel saved', value: `${round(bucket.fuelSaved, 2)} ltrs` }
		]
	};
}

function round(n: number, dp: number): number {
	const p = Math.pow(10, dp);
	return Math.round(n * p) / p;
}

function generateCorporationJson(
	corpId: string,
	corpName: string,
	agg: Aggregation,
	state: LeaderboardState,
	defaultCity: string
): unknown {
	const result: {
		corporationId: string;
		corporationName: string;
		city: string;
		dimensions: Record<string, { rows: CompanyRow[] }>;
	} = {
		corporationId: corpId,
		corporationName: corpName,
		city: defaultCity,
		dimensions: {}
	};

	const commuteCounts: Record<string, number> = {};
	for (const dim of DIMENSIONS) {
		const companies = Object.entries(agg[dim]?.[corpName] ?? {}).map(([company, bucket]) =>
			createCompanyEntry(company, bucket, dim, corpName, state)
		);
		rankEntries(companies);
		result.dimensions[dim] = { rows: companies };

		if (dim === 'commuteAll') {
			for (const c of companies) commuteCounts[c.name] = c.activities;
		}
	}

	// Recreation correction: activities = total - commute
	for (const dim of ['recreationAll', 'recreationWalk', 'recreationCycle'] as const) {
		for (const company of result.dimensions[dim]?.rows ?? []) {
			const total = state.companyTotalActivities[company.name] ?? 0;
			const commute = commuteCounts[company.name] ?? 0;
			company.activities = Math.max(0, total - commute);
		}
	}

	return result;
}

function corporationTotals(
	companies: Record<string, CompanyBucket>,
	state: LeaderboardState
): { activities: number; co2Offset: number; fuelSaved: number; moneySaved: number; participants: number } {
	let participants = 0;
	for (const [companyName, bucket] of Object.entries(companies)) {
		participants += state.companyParticipants[companyName] ?? bucket.participantIds.size;
	}
	return {
		activities: Object.values(companies).reduce((s, c) => s + c.activities, 0),
		co2Offset: Object.values(companies).reduce((s, c) => s + c.co2Offset, 0),
		fuelSaved: Object.values(companies).reduce((s, c) => s + c.fuelSaved, 0),
		moneySaved: Object.values(companies).reduce((s, c) => s + c.moneySaved, 0),
		participants
	};
}

function generateCityJson(
	agg: Aggregation,
	state: LeaderboardState,
	corpJsons: Record<string, ReturnType<typeof generateCorporationJson>>,
	defaultCity: string
): unknown {
	const result: {
		city: string;
		updatedAt: string;
		dimensions: Record<string, { rows: CorpRow[] }>;
	} = {
		city: defaultCity,
		updatedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
		dimensions: {}
	};

	// Pull recreation totals from the generated corporation JSONs.
	const corpRecreationTotals: Record<string, number> = {};
	for (const [corpName, corpId] of Object.entries(CORPORATION_MAPPING)) {
		const data = corpJsons[corpId] as
			| { dimensions?: { recreationAll?: { rows?: { activities?: number }[] } } }
			| undefined;
		if (!data) continue;
		const rows = data.dimensions?.recreationAll?.rows ?? [];
		corpRecreationTotals[corpName] = rows.reduce((s, r) => s + (r.activities ?? 0), 0);
	}

	for (const dim of DIMENSIONS) {
		const corporations: CorpRow[] = [];
		const seen = new Set<string>();

		for (const [corpName, companies] of Object.entries(agg[dim] ?? {})) {
			const corpId = CORPORATION_MAPPING[corpName];
			if (!corpId) continue;
			seen.add(corpName);

			const totals = corporationTotals(companies, state);
			let activities = totals.activities;
			if (dim === 'recreationAll' && corpName in corpRecreationTotals) {
				activities = corpRecreationTotals[corpName];
			}

			const score = calculateScore(
				dim,
				activities,
				totals.participants,
				totals.co2Offset,
				totals.fuelSaved,
				totals.moneySaved
			);

			corporations.push({
				rank: 0,
				corporationId: corpId,
				name: corpName,
				activities,
				co2OffsetKg: round(totals.co2Offset, 2),
				fuelSavedL: round(totals.fuelSaved, 2),
				moneySaved: round(totals.moneySaved, 2),
				companies: Object.keys(companies).length,
				employees: totals.participants,
				score: round(score, 2)
			});
		}

		// Add corporations present in the API leaderboard but absent from aggregation.
		for (const [corpName, corpId] of Object.entries(CORPORATION_MAPPING)) {
			if (seen.has(corpName)) continue;
			const apiData = state.corpData[corpName];
			if (!apiData) continue;
			let activities = apiData.activities_count;
			if (dim === 'recreationAll') activities = corpRecreationTotals[corpName] ?? 0;

			corporations.push({
				rank: 0,
				corporationId: corpId,
				name: corpName,
				activities,
				co2OffsetKg: round(apiData.co2_offset, 2),
				fuelSavedL: round(apiData.fuel_saved, 2),
				moneySaved: round(apiData.money_saved, 2),
				companies: apiData.companies,
				employees: apiData.participants,
				score: 0
			});
		}

		rankEntries(corporations);
		result.dimensions[dim] = { rows: corporations };
	}

	return result;
}

function generateAllJson(
	corpJsons: Record<string, ReturnType<typeof generateCorporationJson>>,
	defaultCity: string
): unknown {
	const allByDim: Record<string, Array<Record<string, unknown> & { rank: number; score?: number }>> = {};
	for (const dim of DIMENSIONS) allByDim[dim] = [];

	for (const [corpName, corpId] of Object.entries(CORPORATION_MAPPING)) {
		const data = corpJsons[corpId] as
			| {
					corporationName?: string;
					dimensions?: Record<string, { rows?: Array<Record<string, unknown>> }>;
			  }
			| undefined;
		if (!data) continue;
		const displayName = data.corporationName ?? corpName;
		for (const dim of DIMENSIONS) {
			const rows = data.dimensions?.[dim]?.rows ?? [];
			for (const row of rows) {
				allByDim[dim].push({
					...row,
					corporationId: corpId,
					corporationName: displayName,
					rank: 0
				});
			}
		}
	}

	const out: {
		corporationId: string;
		corporationName: string;
		city: string;
		dimensions: Record<string, { rows: Array<Record<string, unknown>> }>;
	} = {
		corporationId: 'all',
		corporationName: 'Overall',
		city: defaultCity,
		dimensions: {}
	};

	for (const dim of DIMENSIONS) {
		const companies = allByDim[dim];
		for (const c of companies) {
			if (c.score == null) {
				c.score = round(
					calculateScore(
						dim,
						(c.activities as number) ?? 0,
						(c.employees as number) ?? 0,
						(c.co2OffsetKg as number) ?? 0,
						(c.fuelSavedL as number) ?? 0,
						(c.moneySaved as number) ?? 0
					),
					2
				);
			}
		}
		rankEntries(companies as Array<{ rank: number; score?: number; employees?: number }>);
		out.dimensions[dim] = { rows: companies };
	}
	return out;
}

function generateCompaniesJson(agg: Aggregation, state: LeaderboardState, defaultCity: string): unknown {
	const companiesData: Record<string, unknown> = {};
	for (const dim of DIMENSIONS) {
		for (const [corpName, companies] of Object.entries(agg[dim] ?? {})) {
			const corpId = CORPORATION_MAPPING[corpName];
			if (!corpId) continue;
			for (const [companyName, bucket] of Object.entries(companies)) {
				const companyId = getCompanyId(companyName);
				if (companyId.startsWith('unknown-')) continue;

				if (!(companyId in companiesData)) {
					companiesData[companyId] = {
						companyId,
						companyName,
						corporationId: corpId,
						corporationName: corpName,
						city: defaultCity,
						summary: {
							totalActivities: 0,
							totalCo2Offset: 0,
							totalFuelSaved: 0,
							totalMoneySaved: 0,
							totalParticipants: 0
						}
					};
				}
				const entry = companiesData[companyId] as {
					summary: {
						totalActivities: number;
						totalCo2Offset: number;
						totalFuelSaved: number;
						totalMoneySaved: number;
						totalParticipants: number;
					};
				};
				entry.summary.totalActivities += bucket.activities;
				entry.summary.totalCo2Offset += bucket.co2Offset;
				entry.summary.totalFuelSaved += bucket.fuelSaved;
				entry.summary.totalMoneySaved += bucket.moneySaved;
				if (entry.summary.totalParticipants === 0) {
					entry.summary.totalParticipants =
						state.companyParticipants[companyName] ?? bucket.participantIds.size;
				}
			}
		}
	}
	for (const v of Object.values(companiesData)) {
		const e = v as { summary: { totalCo2Offset: number; totalFuelSaved: number; totalMoneySaved: number } };
		e.summary.totalCo2Offset = round(e.summary.totalCo2Offset, 2);
		e.summary.totalFuelSaved = round(e.summary.totalFuelSaved, 2);
		e.summary.totalMoneySaved = round(e.summary.totalMoneySaved, 2);
	}
	return { companies: Object.values(companiesData) };
}

// ============================================================================
// R2 upload
// ============================================================================

async function putJson(bucket: R2Bucket, key: string, data: unknown): Promise<void> {
	await bucket.put(key, JSON.stringify(data, null, 2), {
		httpMetadata: { contentType: 'application/json' }
	});
}

// ============================================================================
// Entry point
// ============================================================================

async function run(env: Env): Promise<{ uploaded: number }> {
	console.log('Fetching challenge data...');
	const challenge = await fetchChallengeData(env);
	const leaderboard = challenge.leaderboard ?? [];
	const state = extractLeaderboardState(leaderboard);

	console.log('Aggregating activities...');
	const agg = aggregate(challenge);

	console.log('Generating corporation JSONs...');
	const corpJsons: Record<string, unknown> = {};
	for (const [corpName, corpId] of Object.entries(CORPORATION_MAPPING)) {
		corpJsons[corpId] = generateCorporationJson(corpId, corpName, agg, state, env.DEFAULT_CITY);
	}

	console.log('Generating city JSON...');
	const cityJson = generateCityJson(agg, state, corpJsons as any, env.DEFAULT_CITY);

	console.log('Generating All.json...');
	const allJson = generateAllJson(corpJsons as any, env.DEFAULT_CITY);

	console.log('Generating companies.json...');
	const companiesJson = generateCompaniesJson(agg, state, env.DEFAULT_CITY);

	console.log('Fetching overall stats...');
	const stats = await fetchOverallStats(env);

	console.log('Uploading to R2...');
	let uploaded = 0;
	const uploads: Array<[string, unknown]> = [
		['leaderboard/city.json', cityJson],
		['leaderboard/All.json', allJson],
		['leaderboard/companies.json', companiesJson],
		['other/stats.json', stats]
	];
	for (const [corpId, json] of Object.entries(corpJsons)) {
		uploads.push([`leaderboard/${corpId}.json`, json]);
	}

	for (const [key, data] of uploads) {
		await putJson(env.GALA_ASSETS, key, data);
		uploaded++;
		console.log(`✓ ${key}`);
	}

	return { uploaded };
}

export default {
	async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(
			run(env).then(
				(r) => console.log(`Done. Uploaded ${r.uploaded} files.`),
				(err) => console.error('Refresh failed:', err)
			)
		);
	},

	// Manual trigger via HTTP for testing: GET /refresh
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname !== '/refresh') {
			return new Response('Not found', { status: 404 });
		}
		try {
			const result = await run(env);
			return new Response(JSON.stringify({ ok: true, ...result }, null, 2), {
				headers: { 'content-type': 'application/json' }
			});
		} catch (err) {
			return new Response(JSON.stringify({ ok: false, error: String(err) }, null, 2), {
				status: 500,
				headers: { 'content-type': 'application/json' }
			});
		}
	}
};
