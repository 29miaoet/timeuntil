import Calendar from "./calendar";
import Menu from "../classes/menu";
import * as DomUpdate from "../UI/DomUpdate";
import * as SlowDomUpdate from "../UI/SlowDomUpdate";
import * as DayActions from "../modules/DayActions";
import * as Preferences from "../modules/preferences";
import * as Finish from "../modules/finish";
import * as RenderError from "../UI/RenderError";
import { state } from "./state";

const welcomeText =
  "%c🥕 Welcome to timeuntil! 🥕\n%cContribute at %chttps://github.com/29miaoet/timeuntil/";

const checkboxes = document.querySelectorAll<HTMLInputElement>(
  '.sub-dropdown > li > input[type="checkbox"]'
);

const accuracySlider = document.getElementById("accuracy") as HTMLInputElement | null;

let schoolTimeRemaining: number | null;
let totalTimeRemaining: number;
let schoolDates: Array<number> | null;

export async function run() {
  // Welcome
  console.log(
    welcomeText,
    "color: #64b2ff; font-size: 16px; font-weight: bold;",
    "color: #2c2c2c; font-size: 12px;",
    "font-style: italic;"
  );

  try {
    // Put this first since it does not depend on calendar to squeeze out a bit
    // more performance, fine to sandwich initializeMenus() inside since if
    // calendar fails to load, we're toast anyways and it doesn't really matter
    // if the menu works or not.
    state.calendar.loadData();
    initializeMenus();
    await state.calendar.loadData();
  } catch (error) {
    RenderError.calendarLoadError("Failed to load calendar.");
    // return since fatal
    return;
  }

  DayActions.initializeSchoolDay();

  if (!state.calendar.contains(state.calendar.now)) {
    console.error("Outside of calendar time frame, school time unavailable.");
  }

  await Preferences.loadPreferences();

  updateDOM();
  slowUpdateDOM();
  Preferences.addMoreSchools();
  // Recursive function, runs at start of every ${accuracy}th second
  watchUI();
}

export function watchUI() {
  const timeUntilNextBench = state.accuracy - (Date.now() % state.accuracy);
  state.lastUpdate = setTimeout(watchUI, timeUntilNextBench);

  if (Finish.checkFinish()) {
    Finish.triggerFinish();
  } else {
    updateDOM();
  }
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
    Preferences.setPreferredThemes(value);
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
    Preferences.setPreferredCalendars(value);
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
    Preferences.getPreferredDates(value);
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
    Preferences.toggleDisplaySettings(checkboxes);
    // Immediately update dom since elements are not changed if they are hidden
    // Also clear the previous timeout so function calls don't pile up
    clearTimeout(state.lastUpdate);
    watchUI();
  });

  // AccuracySlider
  const accuracyToggle = new Menu("#accuracy-button", ".accuracy-slider");
  accuracyToggle.addExpandCollapse();
  if (accuracySlider) {
    accuracySlider.addEventListener("input", (event) => {
      event.stopPropagation();
      Preferences.setPreferredAccuracy(2000 - Number(accuracySlider.value));
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

      Preferences.setPreferredCalendars("gci");
      Preferences.setPreferredThemes("default");
      Preferences.getPreferredDates("summer");
      Preferences.toggleDisplaySettings(checkboxes, [false, false, false, false, true]);
      Preferences.setPreferredAccuracy(100, accuracySlider);
    });
  }
}

export function updateDOM() {
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
      state.startDate.getTime(),
      state.endDate.getTime()
    );
    SlowDomUpdate.updateProgressBar(fractionPercentage);
  } catch (error) {
    console.error(error);
  }
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
    schoolTimeRemaining = state.calendar.getSchoolTimeTo(state.endDate.getTime());
    schoolDates = state.calendar.getSchoolTimeAsDate(state.endDate.getTime());
  } catch (error) {
    console.error(error);
    schoolTimeRemaining = null;
    schoolDates = null;
  }

  totalTimeRemaining = state.calendar.getAbsoluteTimeTo(state.endDate.getTime());
}
