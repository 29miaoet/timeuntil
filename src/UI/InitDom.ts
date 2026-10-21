import { schoolData } from "../helpers/fetchCalendar";

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
