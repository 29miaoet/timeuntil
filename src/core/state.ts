import Calendar from "./calendar";
import config from "./configReader";

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
    config["School Schedule"]["High School"]["Early Dismissal"],
    config["School Schedule"]["High School"]["Regular"]
  ),
  accuracy: 100,
  lastUpdate: undefined,
  causeOfDeath: null,
  endDate: new Date(config["Summer"]),
  startDate: new Date(config["School Starts"]),
};
