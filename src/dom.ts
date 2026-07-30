import "./styles.css";

import Calendar from "./calendar";

const absoluteTimes = document.querySelectorAll<HTMLDivElement>(".abs-time .times .timebox");
let schoolTimeRemaining: number;
const calendar = new Calendar("calendar.json", 0, 0);
const tempdate = new Date(2026, 9, 9, 18, 0);

async function start() {
  // const absoluteTimes: Element[] = document.querySelector(".abs-time .times .timebox");

  await calendar.loadData();

  updateTimer();
  populateAbsoluteTimes(schoolTimeRemaining);

  setInterval(() => {
    updateTimer();
    populateAbsoluteTimes(schoolTimeRemaining);
  }, 100);
}

function updateTimer() {
  // calendar.freeze();
  // Add 2 months for testing, and a random amount of time,
  // so that it makes the timer change.

  calendar.now = Date.now() + 2*31*24*60*60*1000 - 5*60*60*1000;

  schoolTimeRemaining = calendar.getSchoolTimeTo(tempdate);
  schoolTimeRemaining /= 1000;
}


function populateAbsoluteTimes(schoolTimeRemaining: number) {
  absoluteTimes[0].textContent = schoolTimeRemaining/60/60/24;
  absoluteTimes[1].textContent = schoolTimeRemaining/60/60;
  absoluteTimes[2].textContent = schoolTimeRemaining/60;
  absoluteTimes[3].textContent = schoolTimeRemaining;
}




start();

