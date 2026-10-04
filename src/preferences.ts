import Calendar from "./calendar";
import { state } from "./state";
import { schoolData } from "./fetchCalendar";
import * as App from "./app";
import * as Finish from "./finish";
import * as SlowDomUpdate from "./SlowDomUpdate";

const schoolTimes = document.querySelectorAll<HTMLElement>(".school-time > .timeunit > .timebox");
const absoluteTimes = document.querySelectorAll<HTMLElement>(".abs-time > .times > .timebox");
const dayClassTimes = document.querySelectorAll<HTMLElement>("#class-end > .daytime-unit");
const totalTimes = document.querySelectorAll<HTMLElement>(".total-time > .timeunit > .timebox");
const daySchoolTimes = document.querySelectorAll<HTMLElement>("#school-end > .daytime-unit");

const checkboxes = document.querySelectorAll<HTMLInputElement>(
  '.sub-dropdown > li > input[type="checkbox"]'
);

const schoolTimeLabels = document.querySelectorAll<HTMLElement>(
  ".school-time > .timeunit > .timelabel"
);
const totalTimeLabels = document.querySelectorAll<HTMLElement>(
  ".total-time > .timeunit > .timelabel"
);
const absoluteTimeLabels = document.querySelectorAll<HTMLElement>(
  ".abs-time > .timelabels > .timelabel"
);
const accuracySlider = document.getElementById("accuracy") as HTMLInputElement | null;

type StartEnd = [number, number];
type DateArgs = [number, number, number, number, number];

const termEnds: Array<DateArgs> = [
  [2026, 8, 9, 15, 30],
  [2026, 10, 18, 15, 30],
  [2027, 1, 5, 15, 30],
  [2027, 3, 13, 15, 30],
  [2027, 5, 21, 15, 30],
];

export async function loadPreferences(): Promise<void> {
  // Must be loaded before preferredEndDate
  const preferredCalendar = localStorage.getItem("calendar");
  if (preferredCalendar) {
    await setPreferredCalendars(preferredCalendar);
  }

  const preferredTheme = localStorage.getItem("theme");
  if (preferredTheme) {
    setPreferredThemes(preferredTheme);
  }

  const preferredEndDate = localStorage.getItem("date");
  if (preferredEndDate) {
    getPreferredDates(preferredEndDate);
  }

  const preferredHiddenItems = localStorage.getItem("hiddenItems");
  if (preferredHiddenItems) {
    const hiddenItems: Array<boolean> = JSON.parse(preferredHiddenItems);
    toggleDisplaySettings(checkboxes, hiddenItems);
  }

  const preferredAccuracy = localStorage.getItem("accuracy");
  if (preferredAccuracy) {
    setPreferredAccuracy(Number(preferredAccuracy), accuracySlider);
  }
}

export function addMoreSchools() {
  const dropdownList = document.getElementById("calendars");
  if (!dropdownList) return;

  const fragment = document.createDocumentFragment();

  for (const obj in schoolData) {
    if (schoolData[obj].preBuilt) continue;
    const codeName = schoolData[obj].codeName;

    const listItem = document.createElement("li");
    listItem.dataset.calendar = codeName;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = obj;

    listItem.appendChild(button);
    fragment.appendChild(listItem);
  }

  dropdownList.appendChild(fragment);
}

export function toggleDisplaySettings(
  checkboxes: NodeListOf<HTMLInputElement>,
  hiddenItems: null | Array<boolean> = null
): void {
  let allTimeLabels: Array<Array<HTMLElement>> = [];
  allTimeLabels[0] = [schoolTimeLabels[0], totalTimeLabels[0], absoluteTimeLabels[0]]; // Days
  allTimeLabels[1] = [schoolTimeLabels[1], totalTimeLabels[1], absoluteTimeLabels[1]]; // Hours
  allTimeLabels[2] = [schoolTimeLabels[2], totalTimeLabels[2], absoluteTimeLabels[2]]; // Minutes
  allTimeLabels[3] = [schoolTimeLabels[3], totalTimeLabels[3], absoluteTimeLabels[3]]; // Seconds
  allTimeLabels[4] = [schoolTimeLabels[4], totalTimeLabels[4], absoluteTimeLabels[4]]; // Milliseconds

  let allTimeUnits: Array<Array<HTMLElement>> = [];
  allTimeUnits[0] = [schoolTimes[0], totalTimes[0], absoluteTimes[0]]; // Days
  allTimeUnits[1] = [
    schoolTimes[1],
    totalTimes[1],
    absoluteTimes[1],
    dayClassTimes[0],
    daySchoolTimes[0],
  ]; // Hours
  allTimeUnits[2] = [
    schoolTimes[2],
    totalTimes[2],
    absoluteTimes[2],
    dayClassTimes[1],
    daySchoolTimes[1],
  ]; // Minutes
  allTimeUnits[3] = [
    schoolTimes[3],
    totalTimes[3],
    absoluteTimes[3],
    dayClassTimes[2],
    daySchoolTimes[2],
  ]; // Seconds
  allTimeUnits[4] = [
    schoolTimes[4],
    totalTimes[4],
    absoluteTimes[4],
    dayClassTimes[3],
    daySchoolTimes[3],
  ]; // Milliseconds

  // Which default items should be hidden and which should not
  if (hiddenItems !== null) {
    for (let i = 0; i < hiddenItems.length; i++) {
      if (hiddenItems[i] === true) {
        hiddenItems[i] = true;
        checkboxes[i].checked = false;
        allTimeUnits[i].forEach((item) => {
          if (!item.hidden) {
            item.hidden = true;
          }
        });
        allTimeLabels[i].forEach((item) => {
          if (!item.hidden) {
            item.hidden = true;
          }
        });
      } else if (hiddenItems[i] === false) {
        hiddenItems[i] = false;
        checkboxes[i].checked = true;
        allTimeUnits[i].forEach((item) => {
          if (item.hidden) {
            item.hidden = false;
          }
        });
        allTimeLabels[i].forEach((item) => {
          if (item.hidden) {
            item.hidden = false;
          }
        });
      }
    }

    if (!hiddenItems[0]) setPreferredAccuracy(2000, accuracySlider, false);
    if (!hiddenItems[1]) setPreferredAccuracy(2000, accuracySlider, false);
    if (!hiddenItems[2]) setPreferredAccuracy(1000, accuracySlider, false);
    if (!hiddenItems[3]) setPreferredAccuracy(100, accuracySlider, false);
    if (!hiddenItems[4]) setPreferredAccuracy(0, accuracySlider, false);
  } else {
    hiddenItems = [false, false, false, false, true];
    for (let i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked === false) {
        hiddenItems[i] = true;
        allTimeUnits[i].forEach((item) => {
          if (!item.hidden) {
            item.hidden = true;
          }
        });
        allTimeLabels[i].forEach((item) => {
          if (!item.hidden) {
            item.hidden = true;
          }
        });
      } else if (checkboxes[i].checked === true) {
        hiddenItems[i] = false;
        allTimeUnits[i].forEach((item) => {
          if (item.hidden) {
            item.hidden = false;
          }
        });
        allTimeLabels[i].forEach((item) => {
          if (item.hidden) {
            item.hidden = false;
          }
        });
      }
    }

    if (!hiddenItems[0]) setPreferredAccuracy(2000, accuracySlider);
    if (!hiddenItems[1]) setPreferredAccuracy(2000, accuracySlider);
    if (!hiddenItems[2]) setPreferredAccuracy(1000, accuracySlider);
    if (!hiddenItems[3]) setPreferredAccuracy(100, accuracySlider);
    if (!hiddenItems[4]) setPreferredAccuracy(0, accuracySlider);
  }

  localStorage.setItem("hiddenItems", JSON.stringify(hiddenItems));
}

export function getPreferredDates(value: string) {
  switch (value) {
    case "summer":
      state.endDate = new Date(state.calendar.lastDay);
      state.startDate = new Date(2026, 8, 9, 8, 30);
      state.causeOfDeath = "🎉School Has Ended🎉";
      break;
    case "spring":
      state.endDate = new Date(2027, 2, 25, 15, 30);
      state.startDate = new Date(2026, 8, 9, 8, 30);
      state.causeOfDeath = "Spring Break";
      break;
    case "winter":
      state.endDate = new Date(2026, 11, 18, 14, 30);
      state.startDate = new Date(2026, 8, 9, 8, 30);
      state.causeOfDeath = "Winter Break";
      break;
    case "noschool":
      state.endDate = new Date(state.calendar.findNextNoSchool());
      state.startDate = new Date(state.calendar.findNextNoSchool(true));
      state.causeOfDeath = "No School Right Now";
      break;
    case "weekend":
      state.endDate = new Date(state.calendar.findNextWeekend());
      state.startDate = new Date(state.calendar.findNextWeekend(true));
      state.causeOfDeath = "Weekend";
      break;
    case "lweekend":
      state.endDate = new Date(state.calendar.findNextLongWeekend());
      state.startDate = new Date(state.calendar.findNextLongWeekend(true));
      state.causeOfDeath = "Long Weekend";
      break;
    case "term":
      state.endDate = new Date(state.calendar.findEndTerm(...termEnds));
      state.startDate = new Date(state.calendar.getCurrentTerm(...termEnds));
      state.causeOfDeath = "🎉School Has Ended🎉";
      break;
    case "start":
      state.endDate = new Date(2026, 8, 9, 8, 30);
      state.startDate = new Date(2026, 5, 21, 3, 40);
      state.causeOfDeath = "(Sadly) School Has Started";
      break;
  }
  if (!Finish.checkFinish()) Finish.undoFinish();

  try {
    const fractionPercentage = state.calendar.getPercentCompletion(
      state.startDate.getTime(),
      state.endDate.getTime()
    );
    SlowDomUpdate.updateProgressBar(fractionPercentage);
  } catch (error) {}

  if (Finish.checkFinish()) Finish.triggerFinish();
  else App.updateDOM();

  localStorage.setItem("date", value);
}

export function setPreferredThemes(value: string) {
  document.documentElement.dataset.theme = value;
  localStorage.setItem("theme", value);
  const color = getComputedStyle(document.documentElement).getPropertyValue("--bg-countdown");

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');

  if (!metaThemeColor) {
    console.error("Meta theme color tag is missing.");
    return;
  }
  metaThemeColor.setAttribute("content", color);
}

export function setPreferredAccuracy(
  value: number,
  slider: HTMLInputElement | null = null,
  updateLocalStorage: boolean = true
) {
  if (Number.isNaN(value)) {
    console.error(`Function setPreferredAccuracy recieve invalid argument ${value}.`);
    return;
  }

  state.accuracy = value;
  if (updateLocalStorage) {
    localStorage.setItem("accuracy", String(value));
  }

  if (slider !== null) {
    slider.value = String(2000 - value);
  }

  // Clear the previous function scheduling, important since setPreferredAccuracy
  // is called very often.
  clearTimeout(state.lastUpdate);
  App.watchUI();
}

export async function setPreferredCalendars(value: string) {
  let tempCalendar: Calendar;
  let startingTime: StartEnd;
  let endingTime: StartEnd;

  const matchedSchool = Object.values(schoolData).find((school) => {
    return school.codeName === value;
  });

  if (!matchedSchool) {
    console.error(`Bad codeName ${value}.`);
    return;
  }

  if (!matchedSchool.highSchool) {
    startingTime = [8.75 * 60 * 60 * 1000, 14.5 * 60 * 60 * 1000];
    endingTime = [8.75 * 60 * 60 * 1000, 15.5 * 60 * 60 * 1000];
  } else {
    startingTime = [8.5 * 60 * 60 * 1000, 14.5 * 60 * 60 * 1000];
    endingTime = [8.5 * 60 * 60 * 1000, 15.5 * 60 * 60 * 1000];
  }

  if (matchedSchool.preBuilt) {
    const school_name = `./calendars/${value}.json`;
    tempCalendar = new Calendar(school_name, startingTime, endingTime);
  } else {
    tempCalendar = new Calendar(value, startingTime, endingTime);
  }

  await tempCalendar.loadData();
  // Wait until the data is initialized and loaded before assigning
  // to prevent crashes caused by an incomplete object.
  state.calendar = tempCalendar;

  localStorage.setItem("calendar", value);
}
