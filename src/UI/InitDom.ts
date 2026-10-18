import { schoolData } from "../helpers/fetchCalendar";
import { version } from "../core/configReader";

export function addMoreSchools() {
  const dropdownList = document.getElementById("calendars");
  if (!dropdownList) {
    console.error("School dropdown list not found.");
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const obj in schoolData) {
    if (schoolData[obj].preBuilt) continue;
    const codeName = schoolData[obj].codeName;

    const listItem = document.createElement("li");
    listItem.dataset.calendar = codeName;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = obj;

    listItem.appendChild(button);
    fragment.appendChild(listItem);
  }

  dropdownList.appendChild(fragment);
}

export async function addVersion() {
  const versionDisplay = document.getElementById("version");
  if (!versionDisplay) {
    console.error("Version display not found.");
    return;
  }

  const resolvedVersion: string = await version;
  versionDisplay.textContent = resolvedVersion;
}
