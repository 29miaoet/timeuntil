import Calendar from "../core/calendar";
import Day from "../classes/day";
import { state } from "../core/state";
import { makeReadable } from "../UI/DomUpdate";

const daylabelsContainer = document.querySelector<HTMLElement>(".daylabels-container");
const noSchoolMessage = document.getElementById("noschool-message");
const slotElement = document.getElementById("class-slot");
const classEndTimes = document.querySelectorAll<HTMLElement>("#class-end .timebox");
const schoolEndTimes = document.querySelectorAll<HTMLElement>("#school-end .timebox");

let day: Day;

export function initializeSchoolDay(): void {
  if (!state.calendar.schoolNow()) return;
  const currentDateStamp = Calendar.strftime(state.calendar.now);
  const currentTimeSlot = state.calendar.calendar[currentDateStamp].timeSlot;
  day = new Day(currentTimeSlot);
}

export function getDayBounds(): { start: number; end: number } | undefined {
  // If day is not initialized yet, return undefined
  if (day === undefined) {
    return undefined;
  } else {
    return {
      start: day.start,
      end: day.end,
    };
  }
}

export function updateSchoolDay() {
  if (!daylabelsContainer || !noSchoolMessage) {
    console.error("Current day labels container or no school message not found.");
    return;
  }

  if (state.calendar.schoolNow()) {
    if (daylabelsContainer.hidden) {
      daylabelsContainer.hidden = false;
      if (!noSchoolMessage.hidden) noSchoolMessage.hidden = true;
    }
  } else {
    if (!daylabelsContainer.hidden) {
      daylabelsContainer.hidden = true;
      if (noSchoolMessage.hidden) noSchoolMessage.hidden = false;
    }
    return;
  }

  day.freeze(Calendar.modTimestamp("day", state.calendar.now));
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
