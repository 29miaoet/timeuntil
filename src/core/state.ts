import Calendar from "./calendar";

interface State {
  calendar: Calendar;
  accuracy: number;
  lastUpdate: ReturnType<typeof setTimeout> | undefined;
  causeOfDeath: string | null;
  startDate: Date;
  endDate: Date;
}

export const state: State = {
  calendar: new Calendar(
    "./calendars/gci.json",
    [8.5 * 60 * 60 * 1000, 14.5 * 60 * 60 * 1000],
    [8.5 * 60 * 60 * 1000, 15.5 * 60 * 60 * 1000]
  ),
  accuracy: 100,
  lastUpdate: undefined,
  causeOfDeath: null,
  endDate: new Date(2027, 5, 21, 15, 30),
  startDate: new Date(2026, 8, 9, 8, 30),
};
