import json
from datetime import datetime, timedelta
from datetime import date as date_from_datetime

import requests
import scrape_id

# Get school name

SCHOOL_NAME = input("Enter school name: ")
output_file = f"../public/calendars/{SCHOOL_NAME}.json"

try:
    SITE_ID = scrape_id.get_site_info(SCHOOL_NAME)["site_id"]
except RuntimeError:
    print(SCHOOL_NAME," not found.")

# Configuration

SCHOOL_YEAR = "2026-2027"

START_DATE = "2026-08-01"
END_DATE = "2027-06-21"

# SITE_ID = 80

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
    weekday = current.weekday()  # Monday=0 ... Sunday=6

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
events = requests.post(
    EVENT_URL,
    headers=HEADERS,
    data={
        "ansp": json.dumps(event_payload, separators=(",", ":"))
    }
)

events.raise_for_status()

events = events.json()["Events"]
print("Calendar data aquired.")

# Merge events
NO_SCHOOL_KEYWORDS = [
    "no school",
    "no classes",
    "winter break",
    "spring break",
    "christmas break",
    "victoria day",
    "thanksgiving",
    "family day",
    "labour day",
    "good friday",
    "remembrance day",
    "holiday"
]

EARLY_DISMISSAL_KEYWORDS = [
    "early dismissal"
]

for event in events:

    date = event["StartTime"][:10]

    if date not in calendar:
        continue

    entry = calendar[date]
    title = event["Title"].strip()
    lower = title.lower()

    if title and title not in entry["dayInfo"]:
        entry["dayInfo"].append(title)

    if any(word in lower for word in NO_SCHOOL_KEYWORDS):
        entry["hasSchool"] = False
        entry["status"] = "No School"
        entry["timeSlot"] = "Regular"

        if title not in entry["holidays"]:
            entry["holidays"].append(title)

    elif any(word in lower for word in EARLY_DISMISSAL_KEYWORDS):
        entry["hasSchool"] = True
        entry["status"] = "Early Dismissal"

# Save
calendar = dict(sorted(calendar.items()))

# Add late start remembrance days
# for obj in calendar:
#     if calendar[obj]["hasSchool"]:
#         dt = date_from_datetime.fromisoformat(calendar[obj]["date"])
#         if dt.weekday() == 2:
#             calendar[obj]["dayInfo"].append("Late Start Remembrance Day")


with open(output_file, "w", encoding="utf-8") as f:
    json.dump(calendar, f, indent=2)

print(f"Wrote {len(calendar)} days to {output_file}")
