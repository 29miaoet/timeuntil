import rawSchoolData from "./schools.json";

interface School {
  codeName: string;
  id: number;
  preBuilt: boolean;
  highSchool: boolean;
}

interface SchoolObj {
  [schoolName: string]: School;
}

export const schoolData = rawSchoolData as unknown as SchoolObj;

interface CalendarDay {
  date: string;
  hasSchool: boolean;
  timeSlot: "Regular" | "Early Dismissal";
  status: "Normal School Day" | "No School" | "Early Dismissal";
  holidays: Array<string>;
  dayInfo: Array<string>;
}

interface CalendarIndex {
  [date: string]: CalendarDay;
}

interface EventItem {
  Title?: string;
  StartTime?: string;
  EndTime?: string;
  [key: string]: unknown;
}

interface EventsAPIResponse {
  Events: Array<EventItem>;
}

// Configuration
const START_DATE = "2026-09-05";
const END_DATE = "2027-06-30";

// Hijack lrsd school calendar URLs
const DISTRICT_URL =
  "https://cicmsapi.azurewebsites.net/lrsd/_ci/15/ci/vsb/webservice.ashx";

const HEADERS = {
  "Accept": "*/*",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "Origin": "https://www.lrsd.net",
  "Referer": "https://www.lrsd.net/",
};

function toISODate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSchoolId(schoolName: string): number {
  const schoolObj = Object.values(schoolData).find((school) => school.codeName === schoolName)
  if (!schoolObj) {
    throw new RangeError(`${schoolName} does not exist.`);
  }
  return schoolObj.id;
}

export async function getCalendar(schoolName: string): Promise<CalendarIndex> {
  const eventURL = `${DISTRICT_URL}/${schoolName}`;

  const siteID = getSchoolId(schoolName);

  const calendar: CalendarIndex = {};

  const current = new Date(`${START_DATE}T00:00:00Z`);
  const end = new Date(`${END_DATE}T00:00:00Z`);

  while (current.getTime() <= end.getTime()) {
    const date = toISODate(current);
    const weekday = current.getUTCDay();

    const hasSchool = weekday >= 1 && weekday <= 5;

    calendar[date] = {
      date,
      hasSchool,
      timeSlot: "Regular",
      status: hasSchool ? "Normal School Day" : "No School",
      holidays: [],
      dayInfo: [],
    };

    current.setUTCDate(current.getUTCDate() + 1);
  }

  const search = {
    "Keyword": "",
    "Category": "",
    "StartDate": START_DATE,
    "EndDate": END_DATE,
    "SelectedChildren": [],
    "SelectedCalendars": [],
    "SchoolClasses": [],
    "ForMonthView": true,
    "NoRecurExpand": false,
    "SiteId": siteID,
    "CategoryGuids": [],
  };

  const eventPayload = {
    "CategoryName": "EventsAdvancedSerach",
    "MethodName": "Search",
    "Parameters": {
      "json": JSON.stringify(search),
    },
  };

  const eventsResponse = await fetch(eventURL, {
    method: "POST",
    headers: HEADERS,
    body: new URLSearchParams({
      ansp: JSON.stringify(eventPayload),
    }),
  });

  if (!eventsResponse.ok) {
    throw new Error(`HTTP error! status: ${eventsResponse.status}`);
  }

  const data = (await eventsResponse.json()) as EventsAPIResponse;
  const events = data.Events;

  // Keyword matching via regex
  const noSchoolPatterns: RegExp[] = [
    /\bno school\b/,
    /\bno classes\b/,
    /\b(winter|spring|christmas|fall) break\b/,
    /\bchristmas day\b/,
    /\bboxing day\b/,
    /\bnew year'?s? day\b/,
    /\bvictoria day\b/,
    /\bthanksgiving\b/,
    /\bfamily day\b/,
    /\blabour day\b/,
    /\bgood friday\b/,
    /\bremembrance day\b/,
    /\bcanada day\b/,
    /\bheritage day\b/,
    /\bholiday\b/,
    /\b(in[- ]?service|pd day|professional development)\b/,
  ];

  // Allowlist for events that mention holidays but are actually school days
  const schoolButKeywordMatch = [
    "last day of classes before",
    "first day back",
    "return from",
    "classes resume",
  ];

  function isNoSchool(title: string): boolean {
    const t = title.toLowerCase();
    if (schoolButKeywordMatch.some((phrase) => t.includes(phrase))) {
      return false;
    }
    return noSchoolPatterns.some((p) => p.test(t));
  }

  const earlyDismissalKeywords = ["early dismissal"];

  // Iterate through multi-day events
  for (const event of events) {
    const startStr = (event.StartTime ?? "").slice(0, 10);
    const endStr = (event.EndTime ?? "").slice(0, 10);

    if (!startStr) {
      continue;
    }

    // Date-only ISO strings parse as UTC midnight
    const startDate = new Date(startStr);
    let endDate = endStr ? new Date(endStr) : new Date(startDate.getTime());

    // If EndTime is somehow before StartTime, just use StartTime
    if (endDate.getTime() < startDate.getTime()) {
      endDate = new Date(startDate.getTime());
    }

    const curDate = new Date(startDate.getTime());
    while (curDate.getTime() <= endDate.getTime()) {
      const dateStr = toISODate(curDate);

      const entry = calendar[dateStr];
      if (entry) {
        const title = (event.Title ?? "").trim();
        const lower = title.toLowerCase();

        if (title && !entry.dayInfo.includes(title)) {
          entry.dayInfo.push(title);
        }

        if (isNoSchool(title)) {
          entry.hasSchool = false;
          entry.status = "No School";
          entry.timeSlot = "Regular";

          if (!entry.holidays.includes(title)) {
            entry.holidays.push(title);
          }
        } else if (earlyDismissalKeywords.some((word) => lower.includes(word))) {
          // Only apply early dismissal if the day isn't already marked "No School"
          if (entry.hasSchool) {
            entry.status = "Early Dismissal";
            entry.timeSlot = "Early Dismissal";
          }
        }
      }

      curDate.setUTCDate(curDate.getUTCDate() + 1);
    }
  }

  // Save (sorted)
  const sorted = Object.fromEntries(
    Object.entries(calendar).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  );

  for (const info of Object.values(sorted)) {
    if (!info.hasSchool) {
      continue;
    }
    if (info.holidays.length > 0) {
      continue;
    }

    const dt = new Date(info.date);
    if (dt.getUTCDay() === 3) {
      info.dayInfo.push("Late Start Remembrance Day");
    }
  }

  return sorted;
}
