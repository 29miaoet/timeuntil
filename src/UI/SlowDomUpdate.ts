const progressBar = document.getElementById("progress-bar-element");
const progressText = document.getElementById("percentage");
const dayStatuses = document.querySelectorAll<HTMLElement>(".day-info > .day-card > .card-content");

export function updateProgressBar(fractionPercentage: number) {
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

export function updateDayInfos(dayInfos: DayInfoStruct) {
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
