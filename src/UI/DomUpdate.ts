import * as RenderError from "./RenderError";

const absoluteTimes = document.querySelectorAll<HTMLElement>(".abs-time > .times > .timebox");
const totalTimes = document.querySelectorAll<HTMLElement>(".total-time > .timeunit > .timebox");
const schoolTimes = document.querySelectorAll<HTMLElement>(".school-time > .timeunit > .timebox");

let lastUpdatedSchoolDates: Array<number> = [0, 0, 0, 0, 0];

export function populateAbsoluteTimes(schoolTimeRemaining: number | null) {
  if (schoolTimeRemaining === null) {
    RenderError.absoluteTimeError("Unable to fetch absolute times");
    return;
  }
  let currentComputedTime: number = schoolTimeRemaining;

  // The check here must be implemented element by element and not by a global
  // variable such as lastUpdateSchoolTime, since if the user decides to show
  // an element like absoluteTimes[4], while there is no school, it will still
  // retain its original value since it was not updated as it was hidden by default.

  if (!absoluteTimes[4].hidden && absoluteTimes[4].textContent !== String(currentComputedTime)) {
    absoluteTimes[4].textContent = String(currentComputedTime);
  }
  currentComputedTime /= 1000;

  if (!absoluteTimes[3].hidden && absoluteTimes[3].textContent !== String(currentComputedTime)) {
    absoluteTimes[3].textContent = String(currentComputedTime);
  }
  currentComputedTime /= 60;

  if (!absoluteTimes[2].hidden && absoluteTimes[2].textContent !== String(currentComputedTime)) {
    absoluteTimes[2].textContent = String(currentComputedTime);
  }
  currentComputedTime /= 60;

  if (!absoluteTimes[1].hidden && absoluteTimes[1].textContent !== String(currentComputedTime)) {
    absoluteTimes[1].textContent = String(currentComputedTime);
  }
  currentComputedTime /= 24;

  if (!absoluteTimes[0].hidden && absoluteTimes[0].textContent !== String(currentComputedTime)) {
    absoluteTimes[0].textContent = String(currentComputedTime);
  }
}

export function populateSchoolDates(schoolDates: Array<number> | null) {
  if (!schoolDates) {
    RenderError.schoolTimeError("Unable to fetch absolute times");
    return;
  }

  for (let i = 0; i < 5; i++) {
    if (schoolDates[i] === lastUpdatedSchoolDates[i] || schoolTimes[i].hidden) continue;
    schoolTimes[i].textContent = schoolDates[i].toString();
    lastUpdatedSchoolDates[i] = schoolDates[i];
  }
}

export function populateTotalTimes(timeRemaining: number) {
  const timesRemaining = makeReadable(timeRemaining);

  for (let i = 0; i < timesRemaining.length; i++) {
    if (totalTimes[i].textContent !== timesRemaining[i].toString() && !totalTimes[i].hidden) {
      totalTimes[i].textContent = timesRemaining[i].toString();
    }
  }
}

export function makeReadable(timestamp: number): Array<number> {
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
