import "./styles.css";

import Calendar from "./calendar";

const schoolTimes = document.querySelectorAll<HTMLDivElement>(".school-time .timeunit .timebox");
const totalTimes = document.querySelectorAll<HTMLDivElement>(".total-time .timeunit .timebox");
const absoluteTimes = document.querySelectorAll<HTMLDivElement>(".abs-time .times .timebox");

let schoolTimeRemaining: number;
let totalTimeRemaining: number;
let schoolDates: number;

const calendar = new Calendar("calendar.json", 0, 0);
const tempdate = new Date(2026, 9, 9, 18, 0);

async function start() {
  // const absoluteTimes: Element[] = document.querySelector(".abs-time .times .timebox");

  await calendar.loadData();

  updateTimer();
  populateAbsoluteTimes(schoolTimeRemaining);
  populateTotalTimes(totalTimeRemaining);
  populateSchoolDates(schoolDates);

  setInterval(() => {
    updateTimer();
    populateAbsoluteTimes(schoolTimeRemaining);
    populateTotalTimes(totalTimeRemaining);
    populateSchoolDates(schoolDates);
  }, 100);
}

function updateDOM() {
}

function updateTimer() {
  // calendar.freeze();
  // Add 2 months for testing, and a random amount of time,
  // so that it makes the timer change.

  calendar.now = Date.now() + 2*31*24*60*60*1000 - 5*60*60*1000;
  // console.log(new Date(calendar.now));

  schoolTimeRemaining = calendar.getSchoolTimeTo(tempdate);
  totalTimeRemaining = calendar.getAbsoluteTimeTo(tempdate);
  schoolDates = calendar.getSchoolTimeAsDate(calendar.strftime(tempdate));
}


function populateAbsoluteTimes(schoolTimeRemaining: number) {
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
  for (let i=0; i<4; i++) {
    schoolTimes[i].textContent = schoolDates[i];
  }
}

start();

