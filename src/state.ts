import Calendar from "./calendar";

export const state: { calendar: Calendar } = {
  calendar: new Calendar(
    "./calendars/gci.json",
    [8.5 * 60 * 60 * 1000, 14.5 * 60 * 60 * 1000],
    [8.5 * 60 * 60 * 1000, 15.5 * 60 * 60 * 1000]
  ),
};
