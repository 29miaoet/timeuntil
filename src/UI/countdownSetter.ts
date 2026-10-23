const countdownSettingsElements = document.querySelectorAll<HTMLElement>(
  ".timing-buttons-container > button"
);

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
  });
}

function resetContainerState() {
  for (const option of countdownSettingsElements) {
    option.classList.remove("selected");
  }
}
