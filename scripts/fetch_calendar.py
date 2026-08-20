import json
import re
import sys
from datetime import datetime, timedelta
from datetime import date as date_from_datetime

import requests
import scrape_id

# Get school name
SCHOOL_NAME = input("Enter school name: ")
output_file = f"../public/calendars/{SCHOOL_NAME}.json"

try:
    SITE_ID = scrape_id.get_site_info(SCHOOL_NAME)["site_id"]
except (RuntimeError, KeyError):
    print(f"{SCHOOL_NAME} not found.")
    sys.exit(1)

# Configuration
SCHOOL_YEAR = "2026-2027"

START_DATE = "2026-09-01"
END_DATE = "2027-06-30"

# Hijack lrsd school calendar URLs
DISTRICT_URL = "https://cicmsapi.azurewebsites.net/lrsd/_ci/15/ci/vsb/webservice.ashx"
EVENT_URL = DISTRICT_URL + "/" + SCHOOL_NAME

HEADERS = {
    "Accept": "*/*",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://www.lrsd.net",
    "Referer": "https://www.lrsd.net/",
}

# Generate every day
calendar = {}

current = datetime.strptime(START_DATE, "%Y-%m-%d")
end = datetime.strptime(END_DATE, "%Y-%m-%d")

while current <= end:
    date = current.strftime("%Y-%m-%d")
    weekday = current.weekday()  # Monday = 0, Sunday = 6

    has_school = weekday < 5

    calendar[date] = {
        "date": date,
        "hasSchool": has_school,
        "timeSlot": "Regular",
        "status": "Normal School Day" if has_school else "No School",
        "holidays": [],
        "dayInfo": []
    }

    current += timedelta(days=1)

# Download school events
search = {
    "Keyword": "",
    "Category": "",
    "StartDate": START_DATE,
    "EndDate": END_DATE,
    "SelectedChildren": [],
    "SelectedCalendars": [],
    "SchoolClasses": [],
    "ForMonthView": True,
    "NoRecurExpand": False,
    "SiteId": SITE_ID,
    "CategoryGuids": []
}

event_payload = {
    "CategoryName": "EventsAdvancedSerach",
    "MethodName": "Search",
    "Parameters": {
        "json": json.dumps(search, separators=(",", ":"))
    }
}

print("Fetching calendar data...")
events_response = requests.post(
    EVENT_URL,
    headers=HEADERS,
    data={
        "ansp": json.dumps(event_payload, separators=(",", ":"))
    }
)

events_response.raise_for_status()

events = events_response.json()["Events"]
print("Calendar data aquired.")

# Keyword Matching via Regex
NO_SCHOOL_PATTERNS = [
    r"\bno school\b",
    r"\bno classes\b",
    r"\b(winter|spring|christmas|fall) break\b",
    r"\bchristmas day\b",
    r"\bboxing day\b",
    r"\bnew year'?s? day\b",
    r"\bvictoria day\b",
    r"\bthanksgiving\b",
    r"\bfamily day\b",
    r"\blabour day\b",
    r"\bgood friday\b",
    r"\bremembrance day\b",
    r"\bcanada day\b",
    r"\bheritage day\b",
    r"\bholiday\b",
    r"\b(in[- ]?service|pd day|professional development)\b", # Catches PD days
]

# Allowlist for events that mention holidays but are actually school days
SCHOOL_BUT_KEYWORD_MATCH = [
    "last day of classes before",
    "first day back",
    "return from",
    "classes resume"
]

def is_no_school(title):
    t = title.lower()
    if any(phrase in t for phrase in SCHOOL_BUT_KEYWORD_MATCH):
        return False
    return any(re.search(p, t) for p in NO_SCHOOL_PATTERNS)

EARLY_DISMISSAL_KEYWORDS = ["early dismissal"]

# Iterate through multi-day events
for event in events:
    start_str = event.get("StartTime", "")[:10]
    end_str = event.get("EndTime", "")[:10]
    
    if not start_str:
        continue

    start_date = date_from_datetime.fromisoformat(start_str)
    end_date = date_from_datetime.fromisoformat(end_str) if end_str else start_date
    
    # If EndTime is somehow before StartTime, just use StartTime
    if end_date < start_date:
        end_date = start_date

    cur_date = start_date
    while cur_date <= end_date:
        date_str = cur_date.isoformat()
        
        if date_str in calendar:
            entry = calendar[date_str]
            title = event.get("Title", "").strip()
            lower = title.lower()

            if title and title not in entry["dayInfo"]:
                entry["dayInfo"].append(title)

            if is_no_school(title):
                entry["hasSchool"] = False
                entry["status"] = "No School"
                entry["timeSlot"] = "Regular"

                if title not in entry["holidays"]:
                    entry["holidays"].append(title)

            elif any(word in lower for word in EARLY_DISMISSAL_KEYWORDS):
                # Only apply early dismissal if the day isn't already marked "No School"
                if entry["hasSchool"]:
                    entry["status"] = "Early Dismissal"
                    entry["timeSlot"] = "Early Dismissal"

        cur_date += timedelta(days=1)

# Save
calendar = dict(sorted(calendar.items()))

for date_str, info in calendar.items():
    if not info["hasSchool"]:
        continue
    if info["holidays"]:
        continue
        
    dt = date_from_datetime.fromisoformat(date_str)
    if dt.weekday() == 2:  # Wednesday
        info["dayInfo"].append("Late Start Remembrance Day")

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(calendar, f, indent=2)

print(f"Wrote {len(calendar)} days to {output_file}")
