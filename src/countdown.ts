const absoluteTimes = document.querySelectorAll<HTMLElement>(".abs-time > .times > .timebox");
const absoluteTimeContainer = document.getElementById("abs-time-remaining");
const schoolTimeContainer = document.getElementById("school-time-remaining");
const totalTimes = document.querySelectorAll<HTMLElement>(".total-time > .timeunit > .timebox");
const schoolTimes = document.querySelectorAll<HTMLElement>(".school-time > .timeunit > .timebox");

let lastUpdatedSchoolDates: Array<number> = [0, 0, 0, 0, 0];
let lastUpdatedSchoolTime: number;

export function populateAbsoluteTimes(schoolTimeRemaining: number | null) {
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

export function populateSchoolDates(schoolDates: Array<number> | null) {
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
