import "./styles.css";

import Calendar from "./calendar";

const welcomeText =
  "🥕 Welcome to timeuntil! 🥕\nContribute at https://github.com/29miaoet/timeuntil/";

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

let schoolTimeRemaining: number | null;
let totalTimeRemaining: number;
let schoolDates: Array<number> | null;

const calendar = new Calendar("calendar.json", 0, 0);
let endDate = new Date(2027, 5, 21, 15, 40);
let startingDate = new Date(2026, 8, 9, 8, 30);
startingDate = new Date(Date.now());

let finish = false;

async function start() {
  console.log(welcomeText);
  await calendar.loadData();

  if (!calendar.contains(calendar.now)) {
    console.error("Outside of calendar time frame, school time unavailable.");
  }

  handleTime();

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
    switch (value) {
      case "summer":
        endDate = new Date(2027, 5, 21, 15, 40);
        break;
      case "spring":
        endDate = new Date(2026, 11, 18, 14, 30);
        break;
      case "winter":
        endDate = new Date(2027, 2, 25, 15, 40);
        break;
      case "noschool":
        findNextNoSchool();
        break;
      case "weekend":
        findNextWeekend();
        break;
      case "lweekend":
        findNextLongWeekend();
        break;
      case "term":
        findEndTerm();
        break;
      case "start":
        endDate = new Date(2026, 8, 9, 8, 30);
        break;
    }
  });
}

function findEndTerm() {
  const termEnds = [
    [2026, 10, 18, 15, 40],
    [2027, 1, 5, 15, 40],
    [2027, 3, 13, 15, 40],
    [2027, 5, 21, 15, 40],
  ];
  let termEndDates = [];
  for (const arr of termEnds) {
    const date = new Date(...arr);
    termEndDates.push(date);
  }

  // Get current term
  for (const date of termEndDates) {
    // First term that has not passed
    if (date.getTime() - calendar.now > 0) {
      endDate = new Date(date.getTime());
      return;
    }
  }

  endDate = new Date(calendar.now);
}

function findNextWeekend() {
  const currentDate = new Date(calendar.now);
  const currentWeekday = currentDate.getDay();
  const tempEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );

  if (currentWeekday === 5 || currentWeekday === 6) {
    endDate = new Date(calendar.now);
  } else {
    const daysToAdd = 5 - currentDate.getDay();
    tempEnd.setDate(tempEnd.getDate() + daysToAdd);
  }

  // Rollback to previous day
  tempEnd.setDate(tempEnd.getDate() - 1);
  const stamp: string = calendar.strftime(tempEnd.getTime());

  if (calendar.calendar[stamp].hasSchool) {
    if (calendar.calendar[stamp].timeSlot === "Regular") {
      tempEnd.setHours(15, 40);
    } else if (calendar.calendar[stamp].timeSlot === "Early Dismissal") {
      tempEnd.setHours(14, 30);
    }
  } else {
    tempEnd.setHours(24);
    return;
  }

  endDate = tempEnd;
}

function findNextLongWeekend() {
  for (const day in calendar.calendar) {
    if (day < calendar.strftime(calendar.now)) {
      continue;
    } else {
      let date = new Date(day);
      const next3Days = [
        calendar.strftime(date.getTime()),
        calendar.strftime(date.setTime(date.getTime() + 24 * 60 * 60 * 1000)),
        calendar.strftime(date.setTime(date.getTime() + 24 * 60 * 60 * 1000)),
      ];

      date = new Date(day);
      let next3Weekdays = [date.getDay()];

      date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
      next3Weekdays.push(date.getDay());

      date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
      next3Weekdays.push(date.getDay());

      if (
        !calendar.calendar[next3Days[0]].hasSchool &&
        !calendar.calendar[next3Days[1]].hasSchool &&
        !calendar.calendar[next3Days[2]].hasSchool &&
        ((next3Weekdays[0] === 5 && next3Weekdays[1] === 6) ||
          (next3Weekdays[1] === 5 && next3Weekdays[2] === 6))
      ) {
        const previousDay = new Date(day);
        const previousDayStamp = calendar.strftime(previousDay.getTime());

        if (!calendar.contains(previousDay.getTime())) {
          endDate = new Date(calendar.now);
          return;
        }

        if (calendar.calendar[previousDayStamp].hasSchool) {
          if (calendar.calendar[previousDayStamp].timeSlot === "Regular") {
            previousDay.setHours(15, 40);
          } else if (calendar.calendar[previousDayStamp].timeSlot === "Early Dismissal") {
            previousDay.setHours(14, 30);
          }
        } else {
          endDate = new Date(calendar.now);
          return;
        }

        endDate = new Date(previousDay.getTime());
        return;
      }
    }
  }
}

function findNextNoSchool() {
  for (const day in calendar.calendar) {
    if (day < calendar.strftime(calendar.now)) {
      continue;
    } else {
      if (!calendar.calendar[day].hasSchool) {
        const previousDay = new Date(day);
        const previousDayStamp = calendar.strftime(previousDay.getTime());

        if (!calendar.contains(previousDay.getTime())) {
          endDate = new Date(calendar.now);
          return;
        }

        if (calendar.calendar[previousDayStamp].hasSchool) {
          if (calendar.calendar[previousDayStamp].timeSlot === "Regular") {
            previousDay.setHours(15, 40);
          } else if (calendar.calendar[previousDayStamp].timeSlot === "Early Dismissal") {
            previousDay.setHours(14, 30);
          }
        } else {
          endDate = new Date(calendar.now);
          return;
        }

        endDate = new Date(previousDay.getTime());
        return;
      }
    }
  }
}

function triggerFinish() {
  console.log("Everything has finished.");
  finish = true;
}

function updateDOM() {
  updateTimer();

  populateSchoolDates(schoolDates);
  populateAbsoluteTimes(schoolTimeRemaining);

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
  const fractionPercentage: number = calendar.getPercentCompletion(start.getTime(), end.getTime());
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
