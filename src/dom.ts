import "./styles.css";

import Calendar from "./calendar";

const schoolTimes = document.querySelectorAll<HTMLDivElement>(".school-time .timeunit .timebox");
const totalTimes = document.querySelectorAll<HTMLDivElement>(".total-time .timeunit .timebox");
const absoluteTimes = document.querySelectorAll<HTMLDivElement>(".abs-time .times .timebox");
const dayStatuses = document.querySelectorAll<HTMLDivElement>(".day-info .day-card .card-content");

const progressBar = document.getElementById<HTMLDivElement>("progress-bar-element");
const progressText = document.getElementById<HTMLDivElement>("percentage");

const absoluteTimeContainer = document.getElementById<HTML>("abs-time-remaining");
const schoolTimeContainer = document.getElementById<HTML>("school-time-remaining");
const dayInfoContainer = document.getElementById<HTML>("day-information");

let schoolTimeRemaining: number;
let totalTimeRemaining: number;
let schoolDates: number;

const calendar = new Calendar("calendar.json", 0, 0);
let endDate = new Date(2027, 5, 21, 15, 40);

async function start() {

  await calendar.loadData();

  if (!calendar.contains(calendar.strftime(calendar.now))) {
    console.warn("Outside of calendar time frame, school time unavailable.");
  }


  updateDOM();
  setInterval(() => {
    updateDOM();
  }, 100);
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

  try{
    schoolTimeRemaining = calendar.getSchoolTimeTo(endDate);
    schoolDates = calendar.getSchoolTimeAsDate(calendar.strftime(endDate));
  } catch (Error) {
    schoolTimeRemaining = null;
    schoolDates = null;
  }

  totalTimeRemaining = calendar.getAbsoluteTimeTo(endDate);
}


function populateAbsoluteTimes(schoolTimeRemaining: number) {
  if (!schoolTimeRemaining) {

    // Cancel hard width declaration and add top padding
    absoluteTimeContainer.style.width = "auto";
    absoluteTimeContainer.style.paddingTop = "20px";

    absoluteTimeContainer.innerHTML = `
      <div class="warning-box">
        <p>Unable to fetch absolute times</p>
      </div> `

    return;
  }

  absoluteTimes[0].textContent = schoolTimeRemaining/1000/60/60/24;
  absoluteTimes[1].textContent = schoolTimeRemaining/1000/60/60;
  absoluteTimes[2].textContent = schoolTimeRemaining/1000/60;
  absoluteTimes[3].textContent = schoolTimeRemaining/1000;
}

function populateSchoolTimes(schoolTimeRemaining: number) {
  // See calendar.ts for function usage
  schoolTimes[0].textContent = calendar.floorTimestamp("day", schoolTimeRemaining)/1000/60/60/24;
  schoolTimes[1].textContent = calendar.floorTimestamp("hour", schoolTimeRemaining)/1000/60/60;
  schoolTimes[2].textContent = calendar.modTimestamp("minute", schoolTimeRemaining)/1000/60;
  schoolTimes[3].textContent = calendar.modTimestamp("second", schoolTimeRemaining)/1000;
}


function populateTotalTimes(timeRemaining: number) {
  // See calendar.ts for function usage
  
  // Worst code I have ever written, MUST fix later
  const daysLeft: number = Math.floor(timeRemaining/1000/60/60/24);
  const hoursLeft: number = Math.floor((timeRemaining - daysLeft*1000*60*60*24)/1000/60/60);
  const minutesLeft: number = Math.floor((timeRemaining - daysLeft*1000*60*60*24 - hoursLeft*1000*60*60)/1000/60);
  const secondsLeft: number = Math.floor((timeRemaining - daysLeft*1000*60*60*24 - hoursLeft*1000*60*60 - minutesLeft*1000*60)/1000);

  totalTimes[0].textContent = daysLeft;
  totalTimes[1].textContent = hoursLeft;
  totalTimes[2].textContent = minutesLeft;
  totalTimes[3].textContent = secondsLeft;
}

function populateSchoolDates(schoolDates: Array<number>) {
  if (!schoolDates) {
    // Cancel default stretch style
    schoolTimeContainer.style.alignItems = "center";
    schoolTimeContainer.innerHTML = `
      <div class="warning-box">
        <p>Unable to fetch school time</p>
      </div> `
    return;
  }

  for (let i = 0; i < 4; i++) {
    schoolTimes[i].textContent = schoolDates[i];
  }
}

function updateProgressBar() {
  const start = new Date(2026, 5, 19, 15, 40);

  // Uncomment when school actually starts
  // const start = new Date(2026, 8, 9, 8, 30);
  
  const end = endDate;
  const fractionPercentage: number = calendar.getPercentCompletion(start.getTime(), end.getTime());
  const percentFinished: string = `${fractionPercentage*100}%`;
  progressBar.style.width = percentFinished;
  progressText.textContent = percentFinished;
}

function updateDayInfos() {
  if (!calendar.contains(calendar.strftime(calendar.now))) {
    dayInfoContainer.innerHTML = `
      <div class="warning-box">
        <p>Unable to fetch school day information</p>
      </div> `
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

