import "./styles/styles.css";
import "./styles/themes.css";
import Calendar from "./calendar";
import Menu from "./menu";
import { schoolData } from "./fetchCalendar";
import * as DomUpdate from "./DomUpdate";
import * as SlowDomUpdate from "./SlowDomUpdate";
import * as DayActions from "./DayActions";
import { state } from "./state";

const welcomeText =
  "%c🥕 Welcome to timeuntil! 🥕\n%cContribute at %chttps://github.com/29miaoet/timeuntil/";

const container = document.getElementById("card-container-main") as HTMLElement | null;

const schoolTimes = document.querySelectorAll<HTMLElement>(".school-time > .timeunit > .timebox");
const absoluteTimes = document.querySelectorAll<HTMLElement>(".abs-time > .times > .timebox");
const dayClassTimes = document.querySelectorAll<HTMLElement>("#class-end > .daytime-unit");
const totalTimes = document.querySelectorAll<HTMLElement>(".total-time > .timeunit > .timebox");
const daySchoolTimes = document.querySelectorAll<HTMLElement>("#school-end > .daytime-unit");

const schoolTimeLabels = document.querySelectorAll<HTMLElement>(
  ".school-time > .timeunit > .timelabel"
);
const totalTimeLabels = document.querySelectorAll<HTMLElement>(
  ".total-time > .timeunit > .timelabel"
);
const absoluteTimeLabels = document.querySelectorAll<HTMLElement>(
  ".abs-time > .timelabels > .timelabel"
);

const checkboxes = document.querySelectorAll<HTMLInputElement>(
  '.sub-dropdown > li > input[type="checkbox"]'
);

const accuracySlider = document.getElementById("accuracy") as HTMLInputElement | null;

const lastMessage = document.getElementById("last-message");

let schoolTimeRemaining: number | null;
let totalTimeRemaining: number;
let schoolDates: Array<number> | null;

let endDate: Date = new Date(2027, 5, 21, 15, 30);

let startDate: Date = new Date(2026, 8, 9, 8, 30);
let causeOfDeath: string;

let accuracy: number = 100;
let lastUpdate: ReturnType<typeof setTimeout>;

type DateArgs = [number, number, number, number, number];
type StartEnd = [number, number];

const termEnds: Array<DateArgs> = [
  [2026, 8, 9, 15, 30],
  [2026, 10, 18, 15, 30],
  [2027, 1, 5, 15, 30],
  [2027, 3, 13, 15, 30],
  [2027, 5, 21, 15, 30],
];

async function start() {
  // Welcome
  console.log(
    welcomeText,
    "color: #64b2ff; font-size: 16px; font-weight: bold;",
    "color: #2c2c2c; font-size: 12px;",
    "font-style: italic;"
  );

  await state.calendar.loadData();
  DayActions.initializeSchoolDay();

  if (!state.calendar.contains(state.calendar.now)) {
    console.error("Outside of calendar time frame, school time unavailable.");
  }

  await loadPreferences();

  initializeMenus();
  updateDOM();
  slowUpdateDOM();
  addMoreSchools();
  // Recursive function, runs at start of every ${accuracy}th second
  watchUI();
}

function watchUI() {
  const timeUntilNextBench = accuracy - (Date.now() % accuracy);
  lastUpdate = setTimeout(watchUI, timeUntilNextBench);

  if (checkFinish()) {
    triggerFinish();
  } else {
    updateDOM();
  }
}

async function loadPreferences(): Promise<void> {
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

function addMoreSchools() {
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

function initializeMenus() {
  // themeMenu
  const themeMenu = new Menu("#theme-button", "#themes");
  themeMenu.addExpandCollapse();
  themeMenu.addFunction((event) => {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const option = target.closest<HTMLElement>("[data-theme]");

    if (!option) return;
    const value = option.dataset.theme;

    if (!value) return;
    setPreferredThemes(value);
  });

  // CalendarMenu
  const calendarSettingsMenu = new Menu("#calendar-button", "#calendars");
  calendarSettingsMenu.addExpandCollapse();
  calendarSettingsMenu.addFunction((event) => {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const option = target.closest<HTMLElement>("[data-calendar]");

    if (!option) return;
    const value = option.dataset.calendar;

    if (!value) return;
    setPreferredCalendars(value);
  });

  // TimeMenu
  const timeMenu = new Menu("#time-toggle", "#time-menu");
  timeMenu.addExpandCollapse();
  timeMenu.addFunction((event) => {
    const target = event.target as HTMLElement;
    const option = target.closest<HTMLElement>("[data-value]");

    if (!option) return;
    const value = option.dataset.value;
    if (!value) return;
    getPreferredDates(value);
  });

  // SettingsMenu
  const settingsMenu = new Menu("#settings-button", "#settings");
  settingsMenu.addExpandCollapse();

  // DisplaySelectionMenu
  const displayMenu = new Menu("#display-button", "#displays");
  displayMenu.addExpandCollapseForCheckbox();
  displayMenu.addFunction((event) => {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const ul = target.closest("ul");
    if (!ul) return;
    const checkboxes = ul.querySelectorAll<HTMLInputElement>('li > input[type="checkbox"]');
    toggleDisplaySettings(checkboxes);
    // Immediately update dom since elements are not changed if they are hidden
    // Also clear the previous timeout so function calls don't pile up
    clearTimeout(lastUpdate);
    watchUI();
  });

  // AccuracySlider
  const accuracyToggle = new Menu("#accuracy-button", ".accuracy-slider");
  accuracyToggle.addExpandCollapse();
  if (accuracySlider) {
    accuracySlider.addEventListener("input", (event) => {
      event.stopPropagation();
      setPreferredAccuracy(2000 - Number(accuracySlider.value));
    });
  }

  // RestoreToDefault
  const restoreButton = document.getElementById("danger-button");
  if (restoreButton) {
    restoreButton.addEventListener("click", (event) => {
      event.stopPropagation();
      // Get rid of stored items 1 by 1
      localStorage.removeItem("accuracy");
      localStorage.removeItem("hiddenItems");
      localStorage.removeItem("calendar");
      localStorage.removeItem("themes");
      localStorage.removeItem("date");

      setPreferredCalendars("gci");
      setPreferredThemes("default");
      getPreferredDates("summer");
      toggleDisplaySettings(checkboxes, [false, false, false, false, true]);
      setPreferredAccuracy(100, accuracySlider);
    });
  }
}

function toggleDisplaySettings(
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

function getPreferredDates(value: string) {
  switch (value) {
    case "summer":
      endDate = new Date(state.calendar.lastDay);
      startDate = new Date(2026, 8, 9, 8, 30);
      causeOfDeath = "🎉School Has Ended🎉";
      break;
    case "spring":
      endDate = new Date(2027, 2, 25, 15, 30);
      startDate = new Date(2026, 8, 9, 8, 30);
      causeOfDeath = "Spring Break";
      break;
    case "winter":
      endDate = new Date(2026, 11, 18, 14, 30);
      startDate = new Date(2026, 8, 9, 8, 30);
      causeOfDeath = "Winter Break";
      break;
    case "noschool":
      endDate = new Date(state.calendar.findNextNoSchool());
      startDate = new Date(state.calendar.findNextNoSchool(true));
      causeOfDeath = "No School Right Now";
      break;
    case "weekend":
      endDate = new Date(state.calendar.findNextWeekend());
      startDate = new Date(state.calendar.findNextWeekend(true));
      causeOfDeath = "Weekend";
      break;
    case "lweekend":
      endDate = new Date(state.calendar.findNextLongWeekend());
      startDate = new Date(state.calendar.findNextLongWeekend(true));
      causeOfDeath = "Long Weekend";
      break;
    case "term":
      endDate = new Date(state.calendar.findEndTerm(...termEnds));
      startDate = new Date(state.calendar.getCurrentTerm(...termEnds));
      causeOfDeath = "🎉School Has Ended🎉";
      break;
    case "start":
      endDate = new Date(2026, 8, 9, 8, 30);
      startDate = new Date(2026, 5, 21, 3, 40);
      causeOfDeath = "(Sadly) School Has Started";
      break;
  }
  if (!checkFinish()) undoFinish();

  try {
    const fractionPercentage = state.calendar.getPercentCompletion(
      startDate.getTime(),
      endDate.getTime()
    );
    SlowDomUpdate.updateProgressBar(fractionPercentage);
  } catch (error) {}

  if (checkFinish()) triggerFinish();
  else updateDOM();

  localStorage.setItem("date", value);
}

function setPreferredThemes(value: string) {
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

function setPreferredAccuracy(
  value: number,
  slider: HTMLInputElement | null = null,
  updateLocalStorage: boolean = true
) {
  if (Number.isNaN(value)) {
    console.error(`Function setPreferredAccuracy recieve invalid argument ${value}.`);
    return;
  }

  accuracy = value;
  if (updateLocalStorage) {
    localStorage.setItem("accuracy", String(value));
  }

  if (slider !== null) {
    slider.value = String(2000 - value);
  }

  // Clear the previous function scheduling, important since setPreferredAccuracy
  // is called very often.
  clearTimeout(lastUpdate);
  watchUI();
}

async function setPreferredCalendars(value: string) {
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

function checkFinish() {
  const now = new Date(state.calendar.now);
  return now >= endDate;
}

function triggerFinish() {
  // Finished
  if (!container || !lastMessage) return;
  if (!container.hidden) container.hidden = true;
  if (lastMessage.textContent !== causeOfDeath) lastMessage.textContent = causeOfDeath;
  if (lastMessage.hidden) lastMessage.hidden = false;
}

function undoFinish() {
  // Not finished
  if (!container || !lastMessage) return;
  container.hidden = false;
  lastMessage.hidden = true;
}

function updateDOM() {
  updateTimer();

  DomUpdate.populateAbsoluteTimes(schoolTimeRemaining);
  DomUpdate.populateSchoolDates(schoolDates);
  DomUpdate.populateTotalTimes(totalTimeRemaining);
  DayActions.updateSchoolDay();
}

// Only runs once a day to conserve resources
function slowUpdateDOM() {
  DayActions.initializeSchoolDay();
  try {
    const fractionPercentage = state.calendar.getPercentCompletion(
      startDate.getTime(),
      endDate.getTime()
    );
    SlowDomUpdate.updateProgressBar(fractionPercentage);
  } catch (error) {}
  const dayInfos = state.calendar.getDayInfo(Calendar.strftime(state.calendar.now));
  SlowDomUpdate.updateDayInfos(dayInfos);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  tomorrow.setHours(0, 0, 0, 0);

  const delay = tomorrow.getTime() - Date.now();

  setTimeout(() => {
    slowUpdateDOM();
  }, delay);
}

function updateTimer() {
  state.calendar.freeze();

  try {
    schoolTimeRemaining = state.calendar.getSchoolTimeTo(endDate.getTime());
    schoolDates = state.calendar.getSchoolTimeAsDate(endDate.getTime());
  } catch (error) {
    console.error(error);
    schoolTimeRemaining = null;
    schoolDates = null;
  }

  totalTimeRemaining = state.calendar.getAbsoluteTimeTo(endDate.getTime());
}

start();
