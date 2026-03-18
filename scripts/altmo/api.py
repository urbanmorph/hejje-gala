#!/usr/bin/env python3
"""
Script to generate leaderboard JSONs from challenge API data.

Fetches challenge stats from the API and generates:
- Corporation-level JSONs (one per corporation/campus)
- City-level JSON (aggregating all corporations)
- All.json (combining all corporations)
"""

import json
import os
import argparse
import requests
from pathlib import Path
from collections import defaultdict
from typing import Dict, Any, Tuple, List, Optional
from datetime import datetime

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    boto3 = None

# ============================================================================
# Configuration
# ============================================================================

ALTMO_DOMAIN = os.getenv("ALTMO_DOMAIN", "")
ALTMO_API_KEY = os.getenv("ALTMO_API_KEY", "")
ALTMO_CHALLENGE_ID = int(os.getenv("ALTMO_CHALLENGE_ID", ""))
ALTMO_CITY_ID = int(os.getenv("ALTMO_CITY_ID", ""))
DEFAULT_CITY = "Bengaluru"

CORPORATION_MAPPING = {
    "GBA Central": "central",
    "GBA East": "east",
    "GBA North": "north",
    "GBA South": "south",
    "GBA West": "west",
    "ELCITA": "elcita",
    "Bangalore Urban": "blr-urban",
    "Bangalore Rural": "blr-rural"
}

DIMENSIONS = [
    "recreationAll", "recreationWalk", "recreationCycle",
    "commuteAll", "commuteWalk", "commuteCycle",
    "transitAll", "transitWalk", "transitCycle",
]

# Paths
BASE_DIR = Path(__file__).parent
LEADERBOARD_DIR = BASE_DIR / "r2" / "leaderboard"
OTHER_DIR = BASE_DIR / "r2" / "other"
COMPANY_DIR = BASE_DIR / "r2" / "company"
TEMP_DIR = BASE_DIR / "temp"

for dir_path in [LEADERBOARD_DIR, OTHER_DIR, COMPANY_DIR, TEMP_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# R2 Configuration
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = "hejje-gala-assets"
R2_LEADERBOARD_PREFIX = "leaderboard/"
R2_OTHER_PREFIX = "other/"

# Constants
METRIC_KEYS = ["distance", "co2Offset", "fuelSaved", "moneySaved"]
SCORE_WEIGHTS = {"activities": 0.5, "co2Offset": 0.3, "fuelSaved": 0.1, "moneySaved": 0.1}


# ============================================================================
# Utility Functions
# ============================================================================

def load_json(path: Path, default: Any = None) -> Any:
    """Load JSON from file, return default if file doesn't exist."""
    if not path.exists():
        return default
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Error loading {path.name}: {e}")
        return default


def save_json(data: Any, path: Path) -> None:
    """Save data as JSON to file."""
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Generated {path}")


def calculate_score(dimension: str, activities: int, employees: int,
                   co2_offset: float = 0.0, fuel_saved: float = 0.0,
                   money_saved: float = 0.0) -> float:
    """Calculate score based on dimension type."""
    if dimension.startswith("recreation"):
        return activities * employees
    return (activities * SCORE_WEIGHTS["activities"] +
            co2_offset * SCORE_WEIGHTS["co2Offset"] +
            fuel_saved * SCORE_WEIGHTS["fuelSaved"] +
            money_saved * SCORE_WEIGHTS["moneySaved"])


def rank_entries(entries: List[Dict[str, Any]], rank_key: callable, 
                 emp_count_map: Optional[Dict[str, int]] = None) -> None:
    """Sort entries by rank_key and assign ranks.
    
    When entries have the same score, they are ranked in descending order
    by number of employees (more employees = better rank).
    
    Args:
        entries: List of entries to rank
        rank_key: Function to extract score from an entry
        emp_count_map: Optional mapping of company name to empCount from companies-blr.json.
                      If provided and entry has a "name" field, uses empCount from map.
                      Otherwise falls back to "employees" field in entry.
    """
    def sort_key(entry: Dict[str, Any]) -> Tuple[float, int]:
        """Return tuple (score, employees) for sorting."""
        score = rank_key(entry)
        # For companies, prefer empCount from companies-blr.json if available
        if emp_count_map and "name" in entry:
            company_name = entry.get("name")
            employees = emp_count_map.get(company_name, entry.get("employees", 0))
        else:
            # For corporations or entries without name, use employees field
            employees = entry.get("employees", 0)
        return (score, employees)
    
    entries.sort(key=sort_key, reverse=True)
    for idx, entry in enumerate(entries, start=1):
        entry["rank"] = idx


# ============================================================================
# API Client
# ============================================================================

class APIClient:
    """Handles all API requests to the Altmo API."""
    
    def __init__(self, domain: str = ALTMO_DOMAIN, api_key: str = ALTMO_API_KEY):
        self.base_url = f"https://{domain}/api/v1"
        self.api_key = api_key
        self.headers = {"accept": "application/json"}
    
    def _get(self, endpoint: str, **params) -> Dict[str, Any]:
        """Make a GET request to the API."""
        url = f"{self.base_url}/{endpoint}"
        params = {**params, "access_token": self.api_key}
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def fetch_challenge_data(self) -> Dict[str, Any]:
        """Fetch challenge data including activities and leaderboard."""
        print(f"Fetching challenge data from {self.base_url}/challenges/{ALTMO_CHALLENGE_ID}...")
        return self._get(f"challenges/{ALTMO_CHALLENGE_ID}")
    
    def fetch_registration_stats(self) -> Dict[str, Any]:
        """Fetch registration statistics."""
        print("Fetching registration stats...")
        challenge_data = self._get(f"challenges/{ALTMO_CHALLENGE_ID}")
        org_ids = challenge_data.get("challenge", {}).get("registeredOrganisationIds", [])

        campus_names = set()
        for org_id in org_ids:
            try:
                temp_path = TEMP_DIR / f"registered-organisation-{org_id}.json"
                if temp_path.exists():
                    # Use cached JSON if available to avoid refetching
                    company_data = load_json(temp_path, {})
                else:
                    # Fetch from API and persist raw company response
                    company_data = self._get(f"companies/{org_id}")
                    save_json(company_data, temp_path)
                campuses = company_data.get("company", {}).get("campusNames", [])
                campus_names.update(name.strip() for name in campuses if name and isinstance(name, str))
            except Exception as e:
                print(f"Warning: Error fetching company {org_id}: {e}")

        # Limit reported corporation (campus) count to a maximum of 6
        corporations_count = min(len(campus_names), 6)

        return {
            "success": True,
            "companies": len(org_ids),
            "corporations": corporations_count,
        }
    
    def fetch_overall_stats(self) -> Dict[str, Any]:
        """Fetch overall statistics."""
        print("Fetching overall statistics...")
        data = self._get("statistics/overall")
        return {"success": True, "overall_statistics": data.get("overall_statistics", {})}
    
    def fetch_companies_blr(self) -> Dict[str, Any]:
        """Fetch all companies for Bangalore using city_id."""
        print("Fetching companies data for Bangalore...")
        return self._get("companies", city_id=ALTMO_CITY_ID)
    
    def fetch_company_details(self, company_id: int) -> Dict[str, Any]:
        """Fetch details for a specific company."""
        return self._get(f"companies/{company_id}")


# ============================================================================
# Activity Processing
# ============================================================================

class ActivityProcessor:
    """Processes and classifies activities."""
    
    ACTIVITY_TYPE_MAP = {
        "recreation": "Recreational",
        "transit": "Transit"
    }
    
    @staticmethod
    def get_activity_type(activity: Dict[str, Any]) -> str:
        """Determine activity type: 'recreation', 'commute', or 'transit'."""
        activity_type = activity.get("attributes", {}).get("type", "")
        if "Recreational" in activity_type:
            return "recreation"
        elif "Transit" in activity_type:
            return "transit"
        return "commute"
    
    @staticmethod
    def get_activity_mode(activity: Dict[str, Any]) -> str:
        """Determine activity mode: 'walk', 'cycle', or 'all'."""
        mode = activity.get("attributes", {}).get("activityType", "").lower()
        if mode == "walk":
            return "walk"
        elif mode in ("cycle", "cycling"):
            return "cycle"
        return "all"
    
    @staticmethod
    def get_dimensions(activity_type: str, activity_mode: str) -> List[str]:
        """Get dimension keys for an activity."""
        dimensions = [f"{activity_type}All"]
        if activity_mode != "all":
            dimensions.append(f"{activity_type}{activity_mode.capitalize()}")
        return dimensions
    
    @staticmethod
    def extract_metrics(activity_attr: Dict[str, Any]) -> Dict[str, float]:
        """Extract metrics from activity attributes."""
        return {
            "distance_km": activity_attr.get("distance", 0) / 1000.0,
            "co2Offset": activity_attr.get("co2Offset", 0),
            "fuelSaved": activity_attr.get("fuelSaved", 0),
            "moneySaved": activity_attr.get("moneySaved", 0),
        }


# ============================================================================
# Company/Corporation Mapping
# ============================================================================

class CompanyMapper:
    """Handles company to corporation mapping."""
    
    @staticmethod
    def build_mapping(leaderboard: List[Dict[str, Any]], activities: List[Dict[str, Any]] = None) -> Dict[str, str]:
        """Build mapping from company name to corporation name.
        
        Args:
            leaderboard: Leaderboard data from API
            activities: Activities data from API (unused, kept for compatibility)
        
        Returns:
            Dictionary mapping company name to corporation name
        """
        company_to_corp = {}
        
        # Build company to corporation mapping from leaderboard
        for entry in leaderboard:
            corp_name = entry.get("name", "")
            for child in entry.get("child_entities", []):
                company_name = child.get("name", "")
                if company_name:
                    company_to_corp[company_name] = corp_name
        
        return company_to_corp
    
    @staticmethod
    def get_company_and_corp(activity_attr: Dict[str, Any],
                             company_to_corp: Dict[str, str]) -> Tuple[Optional[str], Optional[str]]:
        """Extract company and corporation names from activity."""
        company_name = (activity_attr.get("commutableName") or
                       activity_attr.get("companyName") or None)
        
        if not company_name or company_name == "unavailable":
            return None, None
        
        corporation_name = company_to_corp.get(company_name)
        if not corporation_name:
            # Try to infer from company name
            for corp_name in CORPORATION_MAPPING:
                if corp_name.lower() in company_name.lower():
                    corporation_name = corp_name
                    break
        
        return (company_name, corporation_name) if corporation_name else (None, None)
    
    @staticmethod
    def get_corp_id(corporation_name: str) -> str:
        """Get corporation ID from corporation name."""
        return CORPORATION_MAPPING.get(corporation_name, "")


# ============================================================================
# Aggregation
# ============================================================================

class ActivityAggregator:
    """Aggregates activities by company and corporation."""
    
    def __init__(self, processor: ActivityProcessor, mapper: CompanyMapper):
        self.processor = processor
        self.mapper = mapper
    
    def _init_aggregation(self, by_user: bool) -> Dict[str, Any]:
        """Initialize aggregation structure."""
        if by_user:
            return {
                dim: defaultdict(lambda: {
                    "activities": [],
                    "company_name": None,
                    "corporation_name": None,
                    "distance": 0.0,
                    "co2Offset": 0.0,
                    "fuelSaved": 0.0,
                    "moneySaved": 0.0
                })
                for dim in DIMENSIONS
            }
        else:
            return {
                dim: defaultdict(lambda: defaultdict(lambda: {
                    "activities": [],
                    "participants": set(),
                    "distance": 0.0,
                    "co2Offset": 0.0,
                    "fuelSaved": 0.0,
                    "moneySaved": 0.0
                }))
                for dim in DIMENSIONS
            }
    
    def _process_activity(self, activity: Dict[str, Any], company_to_corp: Dict[str, str],
                         aggregation: Dict[str, Any], by_user: bool) -> None:
        """Process a single activity and update aggregation."""
        activity_attr = activity.get("attributes", {})
        if activity_attr.get("distance", 0) == 0:
            return
        
        activity_type = self.processor.get_activity_type(activity)
        activity_mode = self.processor.get_activity_mode(activity)
        dimensions = self.processor.get_dimensions(activity_type, activity_mode)
        
        company_name, corporation_name = self.mapper.get_company_and_corp(activity_attr, company_to_corp)
        if not company_name or not corporation_name:
            return
        
        metrics = self.processor.extract_metrics(activity_attr)
        user_id = activity.get("relationships", {}).get("user", {}).get("data", {}).get("id")
        
        for dimension in dimensions:
            if dimension not in aggregation:
                continue
            
            if by_user:
                if not user_id:
                    continue
                self._update_user_aggregation(aggregation[dimension], str(user_id), company_name,
                                            corporation_name, activity, metrics)
            else:
                self._update_company_aggregation(aggregation[dimension], corporation_name,
                                                company_name, activity, user_id, metrics)
    
    def _update_user_aggregation(self, dimension_data: Dict, user_id: str, company_name: str,
                                 corporation_name: str, activity: Dict, metrics: Dict) -> None:
        """Update user-level aggregation."""
        user_data = dimension_data[user_id]
        user_data["activities"].append(activity)
        
        if user_data["company_name"] is None:
            user_data["company_name"] = company_name
            user_data["corporation_name"] = corporation_name
        elif user_data["company_name"] != company_name:
            print(f"Warning: User {user_id} has activities from multiple companies: "
                  f"{user_data['company_name']} and {company_name}")
        
        for key in ["distance", "co2Offset", "fuelSaved", "moneySaved"]:
            user_data[key] += metrics.get(key if key != "distance" else "distance_km", 0)
    
    def _update_company_aggregation(self, dimension_data: Dict, corporation_name: str,
                                   company_name: str, activity: Dict, user_id: Any,
                                   metrics: Dict) -> None:
        """Update company-level aggregation."""
        company_data = dimension_data[corporation_name][company_name]
        company_data["activities"].append(activity)
        if user_id:
            company_data["participants"].add(str(user_id))
        
        for key in ["distance", "co2Offset", "fuelSaved", "moneySaved"]:
            metric_key = key if key != "distance" else "distance_km"
            company_data[key] += metrics.get(metric_key, 0)
    
    def aggregate(self, data: Dict[str, Any], by_user: bool = False) -> Dict[str, Any]:
        """Aggregate activities by company/corporation or by user."""
        activities = data.get("activities", [])
        leaderboard = data.get("leaderboard", [])
        company_to_corp = self.mapper.build_mapping(leaderboard, activities)

        aggregation = self._init_aggregation(by_user)

        # Pre-populate aggregation with all companies from the leaderboard so that
        # organisations with zero activities are still present in the leaderboard JSONs.
        # This only applies to company/corporation aggregation, not user-level.
        if not by_user:
            for company_name, corporation_name in company_to_corp.items():
                if not corporation_name:
                    continue
                for dimension in DIMENSIONS:
                    # Accessing the entry ensures it is created with zeroed metrics
                    _ = aggregation[dimension][corporation_name][company_name]

        for activity in activities:
            self._process_activity(activity, company_to_corp, aggregation, by_user)
        
        return aggregation


# ============================================================================
# JSON Generation
# ============================================================================

class JSONGenerator:
    """Generates various JSON files from aggregated data."""
    
    def __init__(self, mapper: CompanyMapper):
        self.mapper = mapper
        self._companies_blr_name_to_id: Dict[str, str] = {}
        self._companies_blr_name_to_emp_count: Dict[str, int] = {}
        # Participants data taken directly from leaderboard API response
        # Maps company name -> participants count (all users from the company)
        self._leaderboard_company_participants: Dict[str, int] = {}
        self._load_company_mappings()
    
    def _load_company_mappings(self) -> None:
        """Load company ID and empCount mappings from companies-blr.json."""
        companies_blr_data = load_json(OTHER_DIR / "companies-blr.json", {})
        if companies_blr_data and companies_blr_data.get("success"):
            for company in companies_blr_data.get("companies", []):
                company_name = company.get("name")
                company_id = company.get("id")
                emp_count = company.get("empCount", 0)
                if company_name and company_id is not None:
                    self._companies_blr_name_to_id[company_name] = str(company_id)
                if company_name and emp_count is not None:
                    self._companies_blr_name_to_emp_count[company_name] = int(emp_count)
            print(f"Loaded {len(self._companies_blr_name_to_id)} company IDs from companies-blr.json")
            print(f"Loaded {len(self._companies_blr_name_to_emp_count)} company empCounts from companies-blr.json")
    
    def set_leaderboard_participants(self, leaderboard: List[Dict[str, Any]]) -> None:
        """Populate participants and total activities mapping from leaderboard API response.

        Uses child_entities[].participants which represents *all* users
        from the company, not just active users in the challenge period.
        Also captures activities_count which includes commute + recreation.
        """
        self._leaderboard_company_participants.clear()
        self._leaderboard_company_activities: Dict[str, int] = {}
        self._leaderboard_corp_data: Dict[str, Dict[str, Any]] = {}
        self._raw_leaderboard = leaderboard or []
        for corp_entry in leaderboard or []:
            corp_name = corp_entry.get("name", "")
            if corp_name:
                self._leaderboard_corp_data[corp_name] = {
                    "activities_count": corp_entry.get("activities_count", 0),
                    "participants": corp_entry.get("participants", 0),
                    "co2_offset": corp_entry.get("co2_offset", 0),
                    "fuel_saved": corp_entry.get("fuel_saved", 0),
                    "distance": corp_entry.get("distance", 0),
                    "money_saved": corp_entry.get("money_saved", 0),
                    "companies": len(corp_entry.get("child_entities", []))
                }
            for child in corp_entry.get("child_entities", []):
                company_name = child.get("name")
                if not company_name:
                    continue
                participants = child.get("participants")
                if participants is not None:
                    try:
                        self._leaderboard_company_participants[company_name] = int(participants)
                    except (TypeError, ValueError):
                        pass
                activities_count = child.get("activities_count")
                if activities_count is not None:
                    try:
                        self._leaderboard_company_activities[company_name] = int(activities_count)
                    except (TypeError, ValueError):
                        pass
    
    def _get_company_id(self, company_name: str) -> str:
        """Generate a company ID from the company name."""
        if company_name in self._companies_blr_name_to_id:
            return self._companies_blr_name_to_id[company_name]
        return f"unknown-{company_name.lower().replace(' ', '-').replace('/', '-')}"
    
    def _create_company_entry(self, company_name: str, company_data: Dict[str, Any],
                              dimension: str, corporation_name: str) -> Dict[str, Any]:
        """Create a company entry for leaderboard JSON."""
        activities_count = len(company_data["activities"])
        # Active users derived from unique participants in activities
        active_users_count = len(company_data["participants"])
        # Employees/participants count taken from leaderboard API if available
        participants_count = self._leaderboard_company_participants.get(
            company_name, active_users_count
        )
        
        score = calculate_score(
            dimension, activities_count, participants_count,
            company_data["co2Offset"], company_data["fuelSaved"], company_data["moneySaved"]
        )
        
        return {
            "rank": 0,
            "companyId": self._get_company_id(company_name),
            "name": company_name,
            "activities": activities_count,
            "co2OffsetKg": round(company_data["co2Offset"], 2),
            "fuelSavedL": round(company_data["fuelSaved"], 2),
            "moneySaved": round(company_data["moneySaved"], 2),
            "employees": participants_count,
            "score": round(score, 2),
            "sector": "Corporate offices",
            "location": corporation_name,
            "description": f"Company participating in {corporation_name} challenge.",
            "metrics": [
                {"label": "Active users", "value": str(participants_count)},
                {"label": "Average weekly activities", "value": str(activities_count)},
                {"label": "CO₂ offset", "value": f"{round(company_data['co2Offset'], 2)} kg"},
                {"label": "Fuel saved", "value": f"{round(company_data['fuelSaved'], 2)} ltrs"}
            ]
        }
    
    def generate_corporation_json(self, corporation_id: str, corporation_name: str,
                                  aggregation: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Generate JSON structure for a corporation."""
        result = {
            "corporationId": corporation_id,
            "corporationName": corporation_name,
            "city": DEFAULT_CITY,
            "dimensions": {}
        }

        # Check if aggregation has any companies for this corporation
        has_aggregated_data = any(
            aggregation.get(dim, {}).get(corporation_name, {})
            for dim in DIMENSIONS
        )

        if has_aggregated_data:
            # Normal path: generate from aggregated activity data
            commute_counts: Dict[str, int] = {}
            for dimension in DIMENSIONS:
                companies = [
                    self._create_company_entry(company_name, company_data, dimension, corporation_name)
                    for company_name, company_data in aggregation.get(dimension, {})
                    .get(corporation_name, {}).items()
                ]
                rank_entries(companies, lambda x: x["score"], self._companies_blr_name_to_emp_count)
                result["dimensions"][dimension] = {"rows": companies}

                if dimension == "commuteAll":
                    for c in companies:
                        commute_counts[c["name"]] = c["activities"]

            # Fix recreation dimensions: activities = leaderboard_total - commute
            for dimension in ["recreationAll", "recreationWalk", "recreationCycle"]:
                if dimension in result["dimensions"]:
                    for company in result["dimensions"][dimension]["rows"]:
                        total = self._leaderboard_company_activities.get(company["name"], 0)
                        commute = commute_counts.get(company["name"], 0)
                        recreation = max(0, total - commute)
                        company["activities"] = recreation
        else:
            # Fallback: populate from API leaderboard data
            corp_api = self._leaderboard_corp_data.get(corporation_name, {})
            if corp_api:
                # Find child entities from the stored leaderboard
                # Build company rows from leaderboard child entities
                child_rows = []
                for company_name, activities_count in self._leaderboard_company_activities.items():
                    participants = self._leaderboard_company_participants.get(company_name, 0)
                    # Only include companies that belong to this corporation
                    # Check by seeing if the company is a child of this corp in the mapping
                    if company_name in self._leaderboard_company_participants:
                        # We need to check corporation membership
                        pass

                # Use corp-level data to create a single entry per company
                # Get child entities from the original leaderboard data
                for lb_entry in (self._raw_leaderboard or []):
                    if lb_entry.get("name") != corporation_name:
                        continue
                    for child in lb_entry.get("child_entities", []):
                        company_name = child.get("name", "")
                        if not company_name:
                            continue
                        total_activities = child.get("activities_count", 0)
                        participants = child.get("participants", 0)
                        co2 = child.get("co2_offset", 0)
                        fuel = child.get("fuel_saved", 0)
                        money = child.get("money_saved", 0)

                        row = {
                            "rank": 0,
                            "companyId": self._get_company_id(company_name),
                            "name": company_name,
                            "activities": total_activities,
                            "co2OffsetKg": round(co2, 2),
                            "fuelSavedL": round(fuel, 2),
                            "moneySaved": round(money, 2),
                            "employees": participants,
                            "score": round(calculate_score("commuteAll", total_activities, participants, co2, fuel, money), 2),
                            "sector": "Corporate offices",
                            "location": corporation_name,
                            "description": f"Company participating in {corporation_name} challenge.",
                            "metrics": []
                        }
                        child_rows.append(row)

                rank_entries(child_rows, lambda x: x["score"], self._companies_blr_name_to_emp_count)
                for dimension in DIMENSIONS:
                    result["dimensions"][dimension] = {"rows": [r.copy() for r in child_rows]}

        return result
    
    def generate_city_json(self, aggregation: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Generate city-level JSON aggregating all corporations."""
        result = {
            "city": DEFAULT_CITY,
            "updatedAt": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "dimensions": {}
        }

        # Load corporation-level JSONs to get recreation-corrected company counts
        corp_recreation_totals: Dict[str, int] = {}
        for corp_name, corp_id in CORPORATION_MAPPING.items():
            corp_data = load_json(LEADERBOARD_DIR / f"{corp_id}.json")
            if corp_data:
                rec_rows = corp_data.get("dimensions", {}).get("recreationAll", {}).get("rows", [])
                corp_recreation_totals[corp_name] = sum(r.get("activities", 0) for r in rec_rows)

        for dimension in DIMENSIONS:
            corporations = []
            seen_corps = set()
            for corporation_name, companies in aggregation.get(dimension, {}).items():
                corp_id = self.mapper.get_corp_id(corporation_name)
                if not corp_id:
                    continue

                seen_corps.add(corporation_name)
                totals = self._calculate_corporation_totals(companies)

                # For recreation dimensions, use the corrected totals from corporation JSONs
                activities = totals["activities"]
                if dimension == "recreationAll" and corporation_name in corp_recreation_totals:
                    activities = corp_recreation_totals[corporation_name]

                score = calculate_score(
                    dimension, activities, totals["participants"],
                    totals["co2Offset"], totals["fuelSaved"], totals["moneySaved"]
                )

                corporations.append({
                    "rank": 0,
                    "corporationId": corp_id,
                    "name": corporation_name,
                    "activities": activities,
                    "co2OffsetKg": round(totals["co2Offset"], 2),
                    "fuelSavedL": round(totals["fuelSaved"], 2),
                    "moneySaved": round(totals["moneySaved"], 2),
                    "companies": len(companies),
                    "employees": totals["participants"],
                    "score": round(score, 2)
                })

            # Add corporations from API leaderboard that have no aggregated activities
            for corp_name, corp_id in CORPORATION_MAPPING.items():
                if corp_name not in seen_corps and corp_name in self._leaderboard_corp_data:
                    api_data = self._leaderboard_corp_data[corp_name]
                    activities = api_data["activities_count"]
                    if dimension == "recreationAll":
                        activities = corp_recreation_totals.get(corp_name, 0)

                    corporations.append({
                        "rank": 0,
                        "corporationId": corp_id,
                        "name": corp_name,
                        "activities": activities,
                        "co2OffsetKg": round(api_data["co2_offset"], 2),
                        "fuelSavedL": round(api_data["fuel_saved"], 2),
                        "moneySaved": round(api_data["money_saved"], 2),
                        "companies": api_data["companies"],
                        "employees": api_data["participants"],
                        "score": 0
                    })

            rank_entries(corporations, lambda x: x["score"])
            result["dimensions"][dimension] = {"rows": corporations}

        return result
    
    def _calculate_corporation_totals(self, companies: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate totals across all companies in a corporation."""
        # Corporation-level participants taken as sum of company-level participants
        # from leaderboard API when available, falling back to unique active users.
        total_participants = 0
        for company_name, company_data in companies.items():
            participants = self._leaderboard_company_participants.get(
                company_name, len(company_data["participants"])
            )
            total_participants += participants
        
        return {
            "activities": sum(len(c["activities"]) for c in companies.values()),
            "co2Offset": sum(c["co2Offset"] for c in companies.values()),
            "fuelSaved": sum(c["fuelSaved"] for c in companies.values()),
            "moneySaved": sum(c["moneySaved"] for c in companies.values()),
            "participants": total_participants
        }
    
    def generate_companies_json(self, aggregation: Dict[str, Dict[str, Any]]) -> None:
        """Generate companies.json with aggregated summary statistics."""
        companies_data = {}
        
        for dimension in DIMENSIONS:
            for corporation_name, companies in aggregation.get(dimension, {}).items():
                corp_id = self.mapper.get_corp_id(corporation_name)
                if not corp_id:
                    continue
                
                for company_name, company_data in companies.items():
                    company_id = self._get_company_id(company_name)
                    
                    if company_id.startswith("unknown-"):
                        continue
                    
                    if company_id not in companies_data:
                        companies_data[company_id] = {
                            "companyId": company_id,
                            "companyName": company_name,
                            "corporationId": corp_id,
                            "corporationName": corporation_name,
                            "city": DEFAULT_CITY,
                            "summary": {
                                "totalActivities": 0,
                                "totalCo2Offset": 0.0,
                                "totalFuelSaved": 0.0,
                                "totalMoneySaved": 0.0,
                                # Total participants should reflect the full
                                # company size from the leaderboard API where
                                # available (child_entities.participants).
                                "totalParticipants": 0
                            }
                        }
                    
                    summary = companies_data[company_id]["summary"]
                    summary["totalActivities"] += len(company_data["activities"])
                    summary["totalCo2Offset"] += company_data["co2Offset"]
                    summary["totalFuelSaved"] += company_data["fuelSaved"]
                    summary["totalMoneySaved"] += company_data["moneySaved"]
                    # Use leaderboard participants (all users from the company)
                    # falling back to active users only if leaderboard data is
                    # missing. Avoid double-counting across dimensions by only
                    # setting this once per company.
                    active_users_count = len(company_data["participants"])
                    participants_count = self._leaderboard_company_participants.get(
                        company_name, active_users_count
                    )
                    if summary["totalParticipants"] == 0:
                        summary["totalParticipants"] = participants_count
        
        # Round numeric values
        for company_data in companies_data.values():
            summary = company_data["summary"]
            summary["totalCo2Offset"] = round(summary["totalCo2Offset"], 2)
            summary["totalFuelSaved"] = round(summary["totalFuelSaved"], 2)
            summary["totalMoneySaved"] = round(summary["totalMoneySaved"], 2)
        
        save_json({"companies": list(companies_data.values())}, LEADERBOARD_DIR / "companies.json")
    
    def generate_all_json(self) -> None:
        """Generate All.json by combining all corporation JSONs."""
        all_companies_by_dimension = {dim: [] for dim in DIMENSIONS}
        
        for corp_name, corp_id in CORPORATION_MAPPING.items():
            corp_data = load_json(LEADERBOARD_DIR / f"{corp_id}.json")
            if not corp_data:
                continue
            
            corporation_name = corp_data.get("corporationName", corp_name)
            
            for dimension in DIMENSIONS:
                rows = corp_data.get("dimensions", {}).get(dimension, {}).get("rows", [])
                for row in rows:
                    row_copy = row.copy()
                    row_copy["corporationId"] = corp_id
                    row_copy["corporationName"] = corporation_name
                    company_name = row_copy.get("name", "")
                    if company_name and "companyId" in row_copy:
                        row_copy["companyId"] = self._get_company_id(company_name)
                    all_companies_by_dimension[dimension].append(row_copy)
        
        all_data = {
            "corporationId": "all",
            "corporationName": "Overall",
            "city": DEFAULT_CITY,
            "dimensions": {},
        }
        
        for dimension in DIMENSIONS:
            companies = all_companies_by_dimension[dimension]
            for company in companies:
                if "score" not in company:
                    company["score"] = round(calculate_score(
                        dimension,
                        company.get("activities", 0),
                        company.get("employees", 0),
                        company.get("co2OffsetKg", 0),
                        company.get("fuelSavedL", 0),
                        company.get("moneySaved", 0)
                    ), 2)
            rank_entries(companies, lambda x: x.get("score", 0), self._companies_blr_name_to_emp_count)
            all_data["dimensions"][dimension] = {"rows": companies}
        
        save_json(all_data, LEADERBOARD_DIR / "All.json")


# ============================================================================
# R2 Upload
# ============================================================================

class R2Uploader:
    """Handles uploading files to R2 (Cloudflare S3-compatible storage)."""
    
    def __init__(self):
        if boto3 is None:
            raise ImportError("boto3 is required for upload. Install it with: pip install boto3")
        
        if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY]):
            raise ValueError(
                "R2 credentials not set. Please set: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
            )
        
        endpoint_url = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )
    
    def upload_file(self, file_path: Path, object_key: str) -> bool:
        """Upload a file to R2 bucket."""
        if not file_path.exists():
            print(f"Warning: File not found: {file_path}")
            return False
        
        print(f"Uploading {file_path.name} to R2 as {object_key}...")
        try:
            self.client.upload_file(
                str(file_path),
                R2_BUCKET_NAME,
                object_key,
                ExtraArgs={"ContentType": "application/json"},
            )
            print(f"✓ Successfully uploaded {object_key}")
            return True
        except ClientError as e:
            print(f"✗ Error uploading {object_key}: {e}")
            return False
    
    def _upload_files(self, files: List[Tuple[Path, str]], prefix: str) -> bool:
        """Upload multiple files with a prefix."""
        success_count = sum(
            1 for file_path, filename in files
            if self.upload_file(file_path, f"{prefix}{filename}")
        )
        print(f"\nUpload complete: {success_count}/{len(files)} successful")
        return success_count == len(files)
    
    def upload_leaderboards(self) -> bool:
        """Upload all leaderboard JSON files to R2."""
        print("\nUploading leaderboard JSONs to R2...")
        files = ["city.json", "All.json", "companies.json"]
        files.extend(f"{corp_id}.json" for corp_id in CORPORATION_MAPPING.values())
        return self._upload_files(
            [(LEADERBOARD_DIR / filename, filename) for filename in files],
            R2_LEADERBOARD_PREFIX
        )
    
    def upload_other(self) -> bool:
        """Upload other JSON files to R2."""
        print("\nUploading other JSONs to R2...")
        files = ["registration-stats.json", "stats.json", "companies-blr.json"]
        return self._upload_files(
            [(OTHER_DIR / filename, filename) for filename in files],
            R2_OTHER_PREFIX
        )
    
    def upload_stats(self) -> bool:
        """Upload stats.json to R2."""
        print("\nUploading stats.json to R2...")
        return self.upload_file(OTHER_DIR / "stats.json", f"{R2_OTHER_PREFIX}stats.json")
    
    def upload_registration_stats(self) -> bool:
        """Upload registration-stats.json to R2."""
        print("\nUploading registration-stats.json to R2...")
        return self.upload_file(OTHER_DIR / "registration-stats.json",
                               f"{R2_OTHER_PREFIX}registration-stats.json")
    
    def upload_companies_blr(self) -> bool:
        """Upload companies-blr.json to R2."""
        print("\nUploading companies-blr.json to R2...")
        return self.upload_file(OTHER_DIR / "companies-blr.json",
                               f"{R2_OTHER_PREFIX}companies-blr.json")


# ============================================================================
# Company Details Generation
# ============================================================================

def generate_company_details(api_client: APIClient) -> None:
    """Fetch and save company details for all companies in companies-blr.json."""
    companies_file = OTHER_DIR / "companies-blr.json"
    
    if not companies_file.exists():
        print(f"Error: {companies_file} not found. Please generate it first using --generate-companies")
        return
    
    companies_data = load_json(companies_file, {})
    companies = companies_data.get("companies", [])
    if not companies:
        print("No companies found in companies-blr.json")
        return
    
    company_ids = [company.get("id") for company in companies if company.get("id")]
    print(f"Found {len(company_ids)} companies to process")
    
    stats = {"fetched": 0, "skipped": 0, "errors": 0}
    
    for company_id in company_ids:
        company_file = COMPANY_DIR / f"{company_id}.json"
        
        if company_file.exists():
            stats["skipped"] += 1
            continue
        
        try:
            print(f"Fetching company {company_id}...")
            company_data = api_client.fetch_company_details(company_id)
            save_json(company_data, company_file)
            stats["fetched"] += 1
        except Exception as e:
            print(f"Error fetching company {company_id}: {e}")
            stats["errors"] += 1
    
    print(f"\nCompany details generation complete:")
    print(f"  Fetched: {stats['fetched']}")
    print(f"  Skipped (already exists): {stats['skipped']}")
    print(f"  Errors: {stats['errors']}")


def generate_locations_json() -> None:
    """Generate locations.json from all company JSON files."""
    print("Generating locations.json from company JSONs...")
    
    existing_data = load_json(OTHER_DIR / "locations.json", {})
    existing_data.setdefault("COMPANY_COORDINATES", {})
    company_coordinates = existing_data["COMPANY_COORDINATES"]
    
    company_files = sorted(COMPANY_DIR.glob("*.json"))
    if not company_files:
        print("No company JSON files found. Please generate company details first.")
        return
    
    stats = {"added": 0, "updated": 0}
    
    for company_file in company_files:
        company_data = load_json(company_file)
        if not company_data:
            continue
        
        company = company_data.get("company", {})
        company_id = company.get("id")
        latitude = company.get("latitude")
        longitude = company.get("longitude")
        
        if all(x is not None for x in [latitude, longitude, company_id]):
            company_id_str = str(company_id)
            was_existing = company_id_str in company_coordinates
            
            company_coordinates[company_id_str] = {"center": [longitude, latitude]}
            
            if was_existing:
                stats["updated"] += 1
            else:
                stats["added"] += 1
    
    existing_data["COMPANY_COORDINATES"] = company_coordinates
    save_json(existing_data, OTHER_DIR / "locations.json")
    
    print(f"Generated locations.json:")
    print(f"  Added: {stats['added']} company locations")
    print(f"  Updated: {stats['updated']} company locations")
    print(f"  Total: {len(company_coordinates)} company locations")


# ============================================================================
# Main Function
# ============================================================================

def main():
    """Main function to generate JSONs from challenge API data."""
    parser = argparse.ArgumentParser(description="Generate JSONs from challenge API data")
    parser.add_argument("--upload", action="store_true", help="Upload generated JSONs to R2")
    parser.add_argument("--generate-stats", action="store_true", help="Generate stats.json")
    parser.add_argument("--generate-registration-stats", action="store_true",
                       help="Generate registration-stats.json")
    parser.add_argument("--generate-leaderboards", action="store_true",
                       help="Generate leaderboard JSONs")
    parser.add_argument("--generate-companies", action="store_true",
                       help="Generate companies-blr.json")
    parser.add_argument("--generate-company-details", action="store_true",
                       help="Generate company detail JSONs and locations.json")
    args = parser.parse_args()
    
    has_errors = False
    generate_all = not any([
        args.generate_stats, args.generate_registration_stats,
        args.generate_leaderboards, args.generate_companies,
        args.generate_company_details
    ])

    # Log values of environment variables
    print(f"ALTMO_DOMAIN: {ALTMO_DOMAIN}")
    print(f"ALTMO_API_KEY: {ALTMO_API_KEY}")
    print(f"ALTMO_CHALLENGE_ID: {ALTMO_CHALLENGE_ID}")
    print(f"ALTMO_CITY_ID: {ALTMO_CITY_ID}")
    
    api_client = APIClient()
    processor = ActivityProcessor()
    mapper = CompanyMapper()
    aggregator = ActivityAggregator(processor, mapper)
    json_generator = JSONGenerator(mapper)
    
    # Generate stats
    if generate_all or args.generate_stats:
        try:
            stats = api_client.fetch_overall_stats()
            save_json(stats, OTHER_DIR / "stats.json")
        except Exception as e:
            print(f"Error generating stats.json: {e}")
            has_errors = True
            if not generate_all:
                return
    
    # Generate registration stats
    if generate_all or args.generate_registration_stats:
        try:
            stats = api_client.fetch_registration_stats()
            save_json(stats, OTHER_DIR / "registration-stats.json")
        except Exception as e:
            print(f"Error generating registration-stats.json: {e}")
            has_errors = True
            if not generate_all:
                return
    
    # Generate leaderboards
    if generate_all or args.generate_leaderboards:
        print("Starting leaderboard generation...")
        try:
            data = api_client.fetch_challenge_data()
        except Exception as e:
            print(f"Error fetching data from API: {e}")
            has_errors = True
            if not generate_all:
                return
            data = {"activities": [], "leaderboard": []}
        
        try:
            data.setdefault("activities", [])
            data.setdefault("leaderboard", [])
            # Use leaderboard API data to populate company-level participants
            # so that leaderboard JSONs reflect total company users, not just active users.
            json_generator.set_leaderboard_participants(data.get("leaderboard", []))
            
            print("Aggregating activities...")
            aggregation = aggregator.aggregate(data, by_user=False)
            
            print("Generating corporation JSONs...")
            for corp_name, corp_id in CORPORATION_MAPPING.items():
                json_data = json_generator.generate_corporation_json(corp_id, corp_name, aggregation)
                save_json(json_data, LEADERBOARD_DIR / f"{corp_id}.json")
            
            print("Generating city JSON...")
            save_json(json_generator.generate_city_json(aggregation), LEADERBOARD_DIR / "city.json")
            
            print("Generating All.json...")
            json_generator.generate_all_json()
            
            print("Generating companies.json...")
            json_generator.generate_companies_json(aggregation)
            
            print("Leaderboard generation complete!")
        except Exception as e:
            print(f"Error during leaderboard generation: {e}")
            has_errors = True
    
    # Generate companies-blr.json
    if generate_all or args.generate_companies:
        try:
            print("Generating companies-blr.json...")
            companies_data = api_client.fetch_companies_blr()
            save_json(companies_data, OTHER_DIR / "companies-blr.json")
        except Exception as e:
            print(f"Error generating companies-blr.json: {e}")
            has_errors = True
            if not generate_all:
                return
    
    # Generate company details and locations
    if generate_all or args.generate_company_details:
        try:
            print("Generating company details...")
            generate_company_details(api_client)
            print("Generating locations.json...")
            generate_locations_json()
        except Exception as e:
            print(f"Error generating company details: {e}")
            has_errors = True
            if not generate_all:
                return
    
    # Upload to R2
    if args.upload and not has_errors:
        try:
            uploader = R2Uploader()
            
            if generate_all or args.generate_leaderboards:
                uploader.upload_leaderboards()
            
            if generate_all or args.generate_stats:
                uploader.upload_stats()
            
            if generate_all or args.generate_registration_stats:
                uploader.upload_registration_stats()
            
            if generate_all or args.generate_companies:
                uploader.upload_companies_blr()
        except (ImportError, ValueError) as e:
            print(f"Error setting up R2 upload: {e}")
        except Exception as e:
            print(f"Error uploading to R2: {e}")


if __name__ == "__main__":
    main()
