export function absoluteTimeError(message: string) {
  const absoluteTimeContainer = document.getElementById("abs-time-remaining");

  if (!absoluteTimeContainer) {
    console.error("Absolute time container not found.");
    return;
  }
  absoluteTimeContainer.style.width = "auto";
  absoluteTimeContainer.style.paddingTop = "20px";

  absoluteTimeContainer.innerHTML = `<div class="warning-box"><p>${message}</p></div>`;
}

export function schoolTimeError(message: string) {
  const schoolTimeContainer = document.getElementById("school-time-remaining");

  if (!schoolTimeContainer) {
    console.error("School times container not found.");
    return;
  }

  // Cancel default stretch style
  schoolTimeContainer.style.alignItems = "center";
  schoolTimeContainer.innerHTML = `<div class="warning-box"><p>${message}</p></div>`;
}

export function calendarLoadError(message: string) {
  const cardContainer = document.getElementById("card-container-main");

  if (!cardContainer) {
    console.error("Main card container not found.");
    return;
  }

  // Cancel default stretch style
  // cardContainer.style.alignItems = "center";
  cardContainer.innerHTML = `<div class="warning-box"><p>${message}</p></div>`;
}
