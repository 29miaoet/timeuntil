interface Containers {
  schoolTime: HTMLElement | null;
  totalTime: HTMLElement | null;
  absoluteTime: HTMLElement | null;
}

const countdownSettingsElements = document.querySelectorAll<HTMLElement>(
  ".timing-buttons-container > button"
);

const containers: Containers = {
  schoolTime: document.getElementById("school-time-card"),
  totalTime: document.getElementById("total-time-card"),
  absoluteTime: document.getElementById("absolute-time-card"),
};

export default function listenCountdownSettings() {
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
    if (!targetContainer || !(targetContainer in containers)) return;
    // Already checked above so assert
    setContainer(targetContainer as keyof Containers);
  });
}

function resetContainerState() {
  for (const option of countdownSettingsElements) {
    option.classList.remove("selected");
  }
}

function setContainer(target: keyof Containers) {
  Object.values(containers).forEach((element: HTMLElement | null) => {
    if (element && !element.hidden) {
      element.hidden = true;
    }
  });

  if (containers[target]) {
    containers[target].hidden = false;
  }
}
