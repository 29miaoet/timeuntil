import { state } from "../core/state";

const container = document.getElementById("card-container-main");
const lastMessage = document.getElementById("last-message");

export function checkFinish() {
  const now = new Date(state.calendar.now);
  return now >= state.endDate;
}

export function triggerFinish() {
  // Finished
  if (!container || !lastMessage) return;
  if (!container.hidden) container.hidden = true;
  if (lastMessage.textContent !== state.causeOfDeath) lastMessage.textContent = state.causeOfDeath;
  if (lastMessage.hidden) lastMessage.hidden = false;
}

export function undoFinish() {
  // Not finished
  if (!container || !lastMessage) return;
  container.hidden = false;
  lastMessage.hidden = true;
}
