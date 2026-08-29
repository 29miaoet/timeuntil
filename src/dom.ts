import "./styles.css";
import "./themes.css";

import Calendar from "./calendar";

const welcomeText =
  "%c🥕 Welcome to timeuntil! 🥕\n%cContribute at %chttps://github.com/29miaoet/timeuntil/";

const container = document.getElementById("card-container-main") as HTMLDivElement | null;

const schoolTimes = document.querySelectorAll<HTMLDivElement>(".school-time .timeunit .timebox");
const totalTimes = document.querySelectorAll<HTMLDivElement>(".total-time .timeunit .timebox");
const absoluteTimes = document.querySelectorAll<HTMLDivElement>(".abs-time .times .timebox");
const dayStatuses = document.querySelectorAll<HTMLDivElement>(".day-info .day-card .card-content");

const progressBar = document.getElementById("progress-bar-element") as HTMLDivElement | null;
const progressText = document.getElementById("percentage") as HTMLDivElement | null;

const absoluteTimeContainer = document.getElementById(
  "abs-time-remaining"
) as HTMLDivElement | null;
const schoolTimeContainer = document.getElementById(
  "school-time-remaining"
) as HTMLDivElement | null;
const dayInfoContainer = document.getElementById("day-information") as HTMLDivElement | null;

const timeToggleButton = document.getElementById("time-toggle") as HTMLElement | null;
const timeMenu = document.getElementById("time-menu") as HTMLElement | null;

const settingsButton = document.getElementById("settings-button") as HTMLElement | null;
const settingsMenu = document.getElementById("settings") as HTMLElement | null;

let schoolTimeRemaining: number | null;
let totalTimeRemaining: number;
let schoolDates: Array<number> | null;

let calendar = new Calendar("./calendars/gci.json");
let endDate = new Date(2027, 5, 21, 15, 40);
// let startingDate = new Date(2026, 8, 9, 8, 30);
let startingDate = new Date(Date.now());

let finish: boolean = false;
let causeOfDeath: string;

const lastMessage = document.getElementById("last-message") as HTMLDivElement | null;

type DateArgs = [number, number, number, number, number];

const termEnds: Array<DateArgs> = [
  [2026, 10, 18, 15, 40],
  [2027, 1, 5, 15, 40],
  [2027, 3, 13, 15, 40],
  [2027, 5, 21, 15, 40],
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

  if (!calendar.contains(calendar.now)) {
    console.error("Outside of calendar time frame, school time unavailable.");
  }

  handleTime();
  await loadPreferences();
  handleSettings();
  handleThemes();
  handleCalendars();

  updateDOM();
  const mainloopId = setInterval(() => {
    if (checkFinish()) {
      // clearInterval(mainloopId);
      triggerFinish();
    } else {
      updateDOM();
    }
  }, 100);
}

async function loadPreferences() {
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
}

function checkFinish() {
  const now = new Date(calendar.now);
  return now >= endDate;
}

function handleTime() {
  if (!timeToggleButton || !timeMenu) {
    console.error("Time toggle menu nonfunctional.");
    return;
  }

  timeToggleButton.addEventListener("click", (e) => {
    if (timeMenu.hidden) {
      timeMenu.hidden = false;
      timeToggleButton.classList.add("open");
    } else {
      timeMenu.hidden = true;
      timeToggleButton.classList.remove("open");
    }
  });

  document.addEventListener("click", (e) => {
    // Stop tsc from complaining
    const target = e.target as Node;
    if (!timeMenu.contains(target) && !timeToggleButton.contains(target)) {
      timeMenu.hidden = true;
      timeToggleButton.classList.remove("open");
    }
  });

  timeMenu.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const option = target.closest<HTMLElement>("[data-value]");

    if (!option) return;
    const value = option.dataset.value;
    if (!value) return;
    getPreferredDates(value);
  });
}

function getPreferredDates(value: string) {
  switch (value) {
    case "summer":
      endDate = new Date(2027, 5, 21, 15, 40);
      causeOfDeath = "🎉School Has Ended🎉";
      break;
    case "spring":
      endDate = new Date(2026, 11, 18, 14, 30);
      causeOfDeath = "Spring Break";
      break;
    case "winter":
      endDate = new Date(2027, 2, 25, 15, 40);
      causeOfDeath = "Winter Break";
      break;
    case "noschool":
      endDate = new Date(calendar.findNextNoSchool());
      causeOfDeath = "No School Right Now";
      break;
    case "weekend":
      endDate = new Date(calendar.findNextWeekend());
      causeOfDeath = "Weekend";
      break;
    case "lweekend":
      endDate = new Date(calendar.findNextLongWeekend());
      causeOfDeath = "Long Weekend";
      break;
    case "term":
      endDate = new Date(calendar.findEndTerm(...termEnds));
      causeOfDeath = "🎉School Has Ended🎉";
      break;
    case "start":
      endDate = new Date(2026, 8, 9, 8, 30);
      causeOfDeath = "(Sadly) School Has Started";
      break;
  }
  if (!checkFinish()) undoFinish();
  localStorage.setItem("date", value);
}

function handleSettings() {
  if (!settingsButton || !settingsMenu) {
    console.error("Time toggle menu nonfunctional.");
    return;
  }

  settingsButton.addEventListener("click", (e) => {
    if (settingsMenu.hidden) {
      settingsMenu.hidden = false;
      settingsButton.classList.add("open");
    } else {
      settingsMenu.hidden = true;
      settingsButton.classList.remove("open");
    }
  });

  document.addEventListener("click", (e) => {
    // Stop tsc from complaining
    const target = e.target as Node;
    if (!settingsMenu.contains(target) && !settingsButton.contains(target)) {
      settingsMenu.hidden = true;
      settingsButton.classList.remove("open");
    }
  });
}

function handleThemes() {
  const themeMenu = document.getElementById("themes") as HTMLElement | null;
  const themeButton = document.getElementById("theme-button") as HTMLDivElement | null;

  if (!themeMenu || !themeButton) {
    console.error("Theme selection nonfunctional");
    return;
  }

  themeButton.addEventListener("click", (e) => {
    if (themeMenu.hidden) {
      themeMenu.hidden = false;
      themeButton.classList.add("open");
    } else {
      themeMenu.hidden = true;
      themeButton.classList.remove("open");
    }
  });

  document.addEventListener("click", (e) => {
    // Stop tsc from complaining
    const target = e.target as Node;
    if (!themeMenu.contains(target) && !themeButton.contains(target)) {
      themeMenu.hidden = true;
      themeButton.classList.remove("open");
    }
  });

  themeMenu.addEventListener("click", (event) => {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const option = target.closest<HTMLElement>("[data-theme]");

    if (!option) return;
    const value = option.dataset.theme;

    if (!value) return;
    setPreferredThemes(value);
  });
}

function handleCalendars() {
  const calendarMenu = document.getElementById("calendars") as HTMLElement | null;
  const calendarButton = document.getElementById("calendar-button") as HTMLDivElement | null;

  if (!calendarMenu || !calendarButton) {
    console.error("Calendar selection nonfunctional");
    return;
  }

  calendarButton.addEventListener("click", (e) => {
    if (calendarMenu.hidden) {
      calendarMenu.hidden = false;
      calendarButton.classList.add("open");
    } else {
      calendarMenu.hidden = true;
      calendarButton.classList.remove("open");
    }
  });

  document.addEventListener("click", (e) => {
    // Stop tsc from complaining
    const target = e.target as Node;
    if (!calendarMenu.contains(target) && !calendarButton.contains(target)) {
      calendarMenu.hidden = true;
      calendarButton.classList.remove("open");
    }
  });

  calendarMenu.addEventListener("click", (event) => {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const option = target.closest<HTMLElement>("[data-calendar]");

    if (!option) return;
    const value = option.dataset.calendar;

    if (!value) return;
    setPreferredCalendars(value);
  });
}

function setPreferredThemes(value: string) {
  document.documentElement.dataset.theme = value;
  localStorage.setItem("theme", value);
}

async function setPreferredCalendars(value: string) {
  const school_name = `./calendars/${value}.json`;

  const tempCalendar = new Calendar(school_name);
  await tempCalendar.loadData();
  // Wait until the data is initialized and loaded before assigning
  // to prevent crashes caused by an incomplete object.
  calendar = tempCalendar;

  localStorage.setItem("calendar", value);
}

function triggerFinish() {
  finish = true;
  if (!container || !lastMessage) return;
  container.hidden = true;
  lastMessage.textContent = causeOfDeath;
  lastMessage.hidden = false;
}

function undoFinish() {
  finish = false;
  if (!container || !lastMessage) return;
  container.hidden = false;
  lastMessage.hidden = true;
}

function updateDOM() {
  populateAbsoluteTimes(schoolTimeRemaining);
  updateTimer();

  populateSchoolDates(schoolDates);

  populateTotalTimes(totalTimeRemaining);
  updateProgressBar();
  updateDayInfos();
}

function updateTimer() {
  calendar.freeze();
  // Add 2 months for testing, and a random amount of time,
  // so that it makes the timer change.

  // Uncomment these 2 lines for testing
  // calendar.now = Date.now() + 2*31*24*60*60*1000 - 5*60*60*1000;
  // console.log(new Date(calendar.now));

  try {
    schoolTimeRemaining = calendar.getSchoolTimeTo(endDate.getTime());
    schoolDates = calendar.getSchoolTimeAsDate(endDate.getTime());
  } catch (e) {
    console.error(e);
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
  }

  absoluteTimes[0].textContent = String(schoolTimeRemaining / 1000 / 60 / 60 / 24);
  absoluteTimes[1].textContent = String(schoolTimeRemaining / 1000 / 60 / 60);
  absoluteTimes[2].textContent = String(schoolTimeRemaining / 1000 / 60);
  absoluteTimes[3].textContent = String(schoolTimeRemaining / 1000);
}

function populateSchoolTimes(schoolTimeRemaining: number) {
  // See calendar.ts for function usage
  schoolTimes[0].textContent = String(
    calendar.floorTimestamp("day", schoolTimeRemaining) / 1000 / 60 / 60 / 24
  );
  schoolTimes[1].textContent = String(
    calendar.floorTimestamp("hour", schoolTimeRemaining) / 1000 / 60 / 60
  );
  schoolTimes[2].textContent = String(
    calendar.modTimestamp("minute", schoolTimeRemaining) / 1000 / 60
  );
  schoolTimes[3].textContent = String(calendar.modTimestamp("second", schoolTimeRemaining) / 1000);
}

function populateTotalTimes(timeRemaining: number) {
  // See calendar.ts for function usage

  // Worst code I have ever written, MUST fix later
  const daysLeft: number = Math.floor(timeRemaining / 1000 / 60 / 60 / 24);
  const hoursLeft: number = Math.floor(
    (timeRemaining - daysLeft * 1000 * 60 * 60 * 24) / 1000 / 60 / 60
  );
  const minutesLeft: number = Math.floor(
    (timeRemaining - daysLeft * 1000 * 60 * 60 * 24 - hoursLeft * 1000 * 60 * 60) / 1000 / 60
  );
  const secondsLeft: number = Math.floor(
    (timeRemaining -
      daysLeft * 1000 * 60 * 60 * 24 -
      hoursLeft * 1000 * 60 * 60 -
      minutesLeft * 1000 * 60) /
      1000
  );

  totalTimes[0].textContent = daysLeft.toString();
  totalTimes[1].textContent = hoursLeft.toString();
  totalTimes[2].textContent = minutesLeft.toString();
  totalTimes[3].textContent = secondsLeft.toString();
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

  for (let i = 0; i < 4; i++) {
    schoolTimes[i].textContent = schoolDates[i].toString();
  }
}

function updateProgressBar() {
  const start = startingDate;

  // Uncomment when school actually starts
  // const start = new Date(2026, 8, 9, 8, 30);

  const end = endDate;
  let fractionPercentage: number;
  try {
    fractionPercentage = calendar.getPercentCompletion(start.getTime(), end.getTime());
  } catch (e) {
    return;
  }

  const percentFinished: string = `${fractionPercentage * 100}%`;

  if (progressBar) {
    progressBar.style.width = percentFinished;
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
    feature = '<p class="card-content">' + dayInfos.feature.join("<br>") + "</p>";
  } else {
    feature = '<p class="card-content">Nothing Interesting</p>';
  }

  let event;
  if (dayInfos.event.length !== 0) {
    event = '<p class="card-content">' + dayInfos.event.join("<br>") + "</p>";
  } else {
    event = '<p class="card-content">No Events</p>';
  }

  dayStatuses[0].textContent = daystatus;
  dayStatuses[1].outerHTML = feature;
  dayStatuses[2].outerHTML = event;
}

start();
