import { state } from "../core/state";
import setProgress from "../modules/setProgress";

interface Containers {
  schoolTime: HTMLElement | null;
  totalTime: HTMLElement | null;
  absoluteTime: HTMLElement | null;
  dayTime: HTMLElement | null;
}

const countdownSettingsElements = document.querySelectorAll<HTMLElement>(
  ".timing-buttons-container > button"
);

const containers: Containers = {
  schoolTime: document.getElementById("school-time-card"),
  totalTime: document.getElementById("total-time-card"),
  absoluteTime: document.getElementById("absolute-time-card"),
  dayTime: document.getElementById("current-day-card"),
};

export function listenCountdownSettings() {
  const countdownSettingsContainer = document.getElementById("timing-container");

  if (!countdownSettingsContainer) {
    console.error("Countdown settings container not found.");
    return;
  }
  countdownSettingsContainer.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (!target) return;
    const selectedOption = target.closest("button");
    if (!selectedOption) return;
    resetContainerState();
    selectedOption.classList.add("selected");

    const targetContainer = selectedOption.dataset.target;
    setContainer(targetContainer);
  });
}

export function setToggleMenu(target: string) {
  if (!target || !(target in containers)) {
    console.error(`${target} is not a valid countdown option.`);
    return;
  }
  countdownSettingsElements.forEach((element) => {
    if (element.dataset.target === target) {
      element.classList.add("selected");
    } else {
      element.classList.remove("selected");
    }
  });
}

function resetContainerState() {
  for (const option of countdownSettingsElements) {
    option.classList.remove("selected");
  }
}

export function setContainer(target: string | undefined) {
  if (!target || !(target in containers)) {
    console.error(`${target} is not a valid countdown option.`);
    return;
  }
  const targetElement = containers[target as keyof Containers];
  Object.values(containers).forEach((element: HTMLElement | null) => {
    if (element && !element.hidden && element !== targetElement) {
      element.hidden = true;
    }
  });

  if (targetElement) {
    targetElement.hidden = false;
  }

  state.countdown = target as keyof Containers;
  setProgress(state.startDate.getTime(), state.endDate.getTime());
  localStorage.setItem("countdown", target);
}
