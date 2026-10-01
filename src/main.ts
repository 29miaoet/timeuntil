import "./styles/styles.css";
import "./styles/themes.css";
import Calendar from "./calendar";
import Day from "./day";
import Menu from "./menu";
import { schoolData } from "./fetchCalendar";

const welcomeText =
  "%c🥕 Welcome to timeuntil! 🥕\n%cContribute at %chttps://github.com/29miaoet/timeuntil/";

const container = document.getElementById("card-container-main") as HTMLElement | null;

const schoolTimes = document.querySelectorAll<HTMLElement>(".school-time > .timeunit > .timebox");
const totalTimes = document.querySelectorAll<HTMLElement>(".total-time > .timeunit > .timebox");
const absoluteTimes = document.querySelectorAll<HTMLElement>(".abs-time > .times > .timebox");
const dayStatuses = document.querySelectorAll<HTMLElement>(".day-info > .day-card > .card-content");
const dayClassTimes = document.querySelectorAll<HTMLElement>("#class-end > span");
const daySchoolTimes = document.querySelectorAll<HTMLElement>("#school-end > span");

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

const progressBar = document.getElementById("progress-bar-element");
const progressText = document.getElementById("percentage");

const absoluteTimeContainer = document.getElementById("abs-time-remaining");
const schoolTimeContainer = document.getElementById("school-time-remaining");
const dayInfoContainer = document.getElementById("day-information");
const accuracySlider = document.getElementById("accuracy") as HTMLInputElement | null;

const lastMessage = document.getElementById("last-message");

const currentDayContainer = document.getElementById("current-day-container");
const slotElement = document.getElementById("class-slot");
const classEndTimes = document.querySelectorAll<HTMLElement>("#class-end .timebox");
const schoolEndTimes = document.querySelectorAll<HTMLElement>("#school-end .timebox");

let schoolTimeRemaining: number | null;
let totalTimeRemaining: number;
let schoolDates: Array<number> | null;

let calendar = new Calendar(
  "./calendars/gci.json",
  [8.5 * 60 * 60 * 1000, 14.5 * 60 * 60 * 1000],
  [8.5 * 60 * 60 * 1000, 15.5 * 60 * 60 * 1000]
);
let day: Day;

let endDate: Date = new Date(2027, 5, 21, 15, 30);

let startDate: Date = new Date(2026, 8, 9, 8, 30);
let causeOfDeath: string;
let lastUpdatedSchoolTime: number;
let lastUpdatedSchoolDates: Array<number> = [0, 0, 0, 0, 0];

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

  await calendar.loadData();
  initializeSchoolDay();

  if (!calendar.contains(calendar.now)) {
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
    classEndTimes[0],
    schoolEndTimes[0],
  ]; // Hours
  allTimeUnits[2] = [
    schoolTimes[2],
    totalTimes[2],
    absoluteTimes[2],
    classEndTimes[1],
    schoolEndTimes[1],
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
      endDate = new Date(calendar.lastDay);
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
      endDate = new Date(calendar.findNextNoSchool());
      startDate = new Date(calendar.findNextNoSchool(true));
      causeOfDeath = "No School Right Now";
      break;
    case "weekend":
      endDate = new Date(calendar.findNextWeekend());
      startDate = new Date(calendar.findNextWeekend(true));
      causeOfDeath = "Weekend";
      break;
    case "lweekend":
      endDate = new Date(calendar.findNextLongWeekend());
      startDate = new Date(calendar.findNextLongWeekend(true));
      causeOfDeath = "Long Weekend";
      break;
    case "term":
      endDate = new Date(calendar.findEndTerm(...termEnds));
      startDate = new Date(calendar.getCurrentTerm(...termEnds));
      causeOfDeath = "🎉School Has Ended🎉";
      break;
    case "start":
      endDate = new Date(2026, 8, 9, 8, 30);
      startDate = new Date(2026, 5, 21, 3, 40);
      causeOfDeath = "(Sadly) School Has Started";
      break;
  }
  if (!checkFinish()) undoFinish();
  updateProgressBar();

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
  calendar = tempCalendar;

  localStorage.setItem("calendar", value);
}

function checkFinish() {
  const now = new Date(calendar.now);
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

  populateAbsoluteTimes(schoolTimeRemaining);
  populateSchoolDates(schoolDates);
  populateTotalTimes(totalTimeRemaining);
  updateSchoolDay();
}

// Only runs once a day to conserve resources
function slowUpdateDOM() {
  initializeSchoolDay();
  updateProgressBar();
  updateDayInfos();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  tomorrow.setHours(0, 0, 0, 0);

  const delay = tomorrow.getTime() - Date.now();

  setTimeout(() => {
    slowUpdateDOM();
  }, delay);
}

function updateTimer() {
  calendar.freeze();

  try {
    schoolTimeRemaining = calendar.getSchoolTimeTo(endDate.getTime());
    schoolDates = calendar.getSchoolTimeAsDate(endDate.getTime());
  } catch (error) {
    console.error(error);
    schoolTimeRemaining = null;
    schoolDates = null;
  }

  totalTimeRemaining = calendar.getAbsoluteTimeTo(endDate.getTime());
}

function populateAbsoluteTimes(schoolTimeRemaining: number | null) {
  if (schoolTimeRemaining === null) {
    if (!absoluteTimeContainer) {
      console.error("Absolute times container not found.");
      return;
    }

    // Cancel hard width declaration and add top padding
    absoluteTimeContainer.style.width = "auto";
    absoluteTimeContainer.style.paddingTop = "20px";

    absoluteTimeContainer.innerHTML = `
      <div class="warning-box">
        <p>Unable to fetch absolute times</p>
      </div> `;

    return;
  } else if (schoolTimeRemaining === lastUpdatedSchoolTime) {
    return;
  }
  if (!absoluteTimes[0].hidden) {
    absoluteTimes[0].textContent = String(schoolTimeRemaining / 1000 / 60 / 60 / 24);
  }
  if (!absoluteTimes[1].hidden) {
    absoluteTimes[1].textContent = String(schoolTimeRemaining / 1000 / 60 / 60);
  }
  if (!absoluteTimes[2].hidden) {
    absoluteTimes[2].textContent = String(schoolTimeRemaining / 1000 / 60);
  }
  if (!absoluteTimes[3].hidden) {
    absoluteTimes[3].textContent = String(schoolTimeRemaining / 1000);
  }
  if (!absoluteTimes[4].hidden) {
    absoluteTimes[4].textContent = String(schoolTimeRemaining);
  }

  lastUpdatedSchoolTime = schoolTimeRemaining;
}

function makeReadable(timestamp: number): Array<number> {
  const daysLeft = Math.floor(timestamp / 1000 / 60 / 60 / 24);
  const hoursLeft = Math.floor((timestamp - daysLeft * 1000 * 60 * 60 * 24) / 1000 / 60 / 60);
  const minutesLeft = Math.floor(
    (timestamp - daysLeft * 1000 * 60 * 60 * 24 - hoursLeft * 1000 * 60 * 60) / 1000 / 60
  );
  const secondsLeft = Math.floor(
    (timestamp -
      daysLeft * 1000 * 60 * 60 * 24 -
      hoursLeft * 1000 * 60 * 60 -
      minutesLeft * 1000 * 60) /
      1000
  );
  const millisecondsLeft = Math.floor(
    timestamp -
      daysLeft * 1000 * 60 * 60 * 24 -
      hoursLeft * 1000 * 60 * 60 -
      minutesLeft * 1000 * 60 -
      secondsLeft * 1000
  );
  const returnArray = [];
  returnArray.push(daysLeft);
  returnArray.push(hoursLeft);
  returnArray.push(minutesLeft);
  returnArray.push(secondsLeft);
  returnArray.push(millisecondsLeft);

  return returnArray;
}

function populateTotalTimes(timeRemaining: number) {
  const timesRemaining = makeReadable(timeRemaining);

  for (let i = 0; i < timesRemaining.length; i++) {
    if (totalTimes[i].textContent !== timesRemaining[i].toString() && !totalTimes[i].hidden) {
      totalTimes[i].textContent = timesRemaining[i].toString();
    }
  }
}

function populateSchoolDates(schoolDates: Array<number> | null) {
  if (!schoolDates) {
    if (!schoolTimeContainer) {
      console.error("School times container not found.");
      return;
    }

    // Cancel default stretch style
    schoolTimeContainer.style.alignItems = "center";
    schoolTimeContainer.innerHTML = `
      <div class="warning-box">
        <p>Unable to fetch school time</p>
      </div> `;
    return;
  }

  for (let i = 0; i < 5; i++) {
    if (schoolDates[i] === lastUpdatedSchoolDates[i] || schoolTimes[i].hidden) continue;
    schoolTimes[i].textContent = schoolDates[i].toString();
    lastUpdatedSchoolDates[i] = schoolDates[i];
  }
}

function updateProgressBar() {
  const start = startDate;

  const end = endDate;
  let fractionPercentage: number;
  try {
    fractionPercentage = calendar.getPercentCompletion(start.getTime(), end.getTime());
  } catch (error) {
    return;
  }

  const percentFinished = `${fractionPercentage * 100}%`;
  const ariaAmountFinished = String(fractionPercentage * 100);

  if (progressBar) {
    progressBar.style.width = percentFinished;
    progressBar.setAttribute("aria-valuenow", ariaAmountFinished);
  } else {
    console.error("Progress bar not found");
  }

  if (progressText) {
    progressText.textContent = percentFinished;
  } else {
    console.error("Progress text not found");
  }
}

function updateDayInfos() {
  if (!calendar.contains(calendar.now)) {
    if (!dayInfoContainer) {
      console.error("Day info container not found.");
      return;
    }

    dayInfoContainer.innerHTML = `
      <div class="warning-box">
        <p>Unable to fetch school day information</p>
      </div> `;
    return;
  }

  const dayInfos = calendar.getDayInfo(calendar.strftime(calendar.now));
  const daystatus = dayInfos.daystatus;

  let feature;
  if (dayInfos.feature.length !== 0) {
    feature = dayInfos.feature.join("\n");
  } else {
    feature = "Nothing Interesting";
  }

  let event;
  if (dayInfos.event.length !== 0) {
    event = dayInfos.event.join("\n");
  } else {
    event = "No Events";
  }

  dayStatuses[0].textContent = daystatus;
  dayStatuses[1].textContent = feature;
  dayStatuses[2].textContent = event;
}

function initializeSchoolDay() {
  if (!calendar.schoolNow()) return;
  const currentDateStamp = calendar.strftime(calendar.now);
  const currentTimeSlot = calendar.calendar[currentDateStamp].timeSlot;
  day = new Day(currentTimeSlot);
}

function updateSchoolDay() {
  if (!currentDayContainer) {
    console.error("Current day container not found.");
    return;
  }

  if (calendar.schoolNow()) {
    if (currentDayContainer.hidden) {
      currentDayContainer.hidden = false;
    }
  } else {
    if (!currentDayContainer.hidden) {
      currentDayContainer.hidden = true;
    }
    return;
  }

  day.freeze(calendar.modTimestamp("day", calendar.now));
  let currentSlot: string | undefined = day.getCurrentSlot();

  if (!slotElement) {
    console.error("One or more school day dom elements not found.");
    return;
  }

  if (currentSlot === undefined) {
    console.error("Slot calculation failure.");
    currentSlot = "-";
  } else {
    slotElement.textContent = currentSlot;

    const classEnds = day.getTimeUntilClassEnds();
    const formattedClassEnds = makeReadable(classEnds);

    for (let i = 1; i < formattedClassEnds.length; i++) {
      // Subtract one because the display does not have a day output.
      const k = i - 1;
      if (
        classEndTimes[k].textContent !== formattedClassEnds[i].toString() &&
        !classEndTimes[k].hidden
      ) {
        classEndTimes[k].textContent = formattedClassEnds[i].toString();
      }
    }
  }

  const schoolEnds = day.getTimeUntilSchoolEnds();
  const formattedSchoolEnds = makeReadable(schoolEnds);

  for (let i = 1; i < formattedSchoolEnds.length; i++) {
    // Subtract one because the display does not have a day output.
    const k = i - 1;
    if (
      schoolEndTimes[k].textContent !== formattedSchoolEnds[i].toString() &&
      !schoolEndTimes[k].hidden
    ) {
      schoolEndTimes[k].textContent = formattedSchoolEnds[i].toString();
    }
  }
}

start();
