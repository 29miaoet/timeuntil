import { state } from "../core/state";
import { updateProgressBar } from "../UI/SlowDomUpdate";
import { getDayBounds } from "./DayActions";

export default function setProgress(start: number, end: number) {
  try {
    let percentCompletion: number;
    switch (state.countdown) {
      case "schoolTime":
      case "absoluteTime":
        percentCompletion = state.calendar.getPercentCompletion(start, end);
        break;
      case "totalTime":
        percentCompletion = (state.calendar.now - start) / (end - start);
        break;
      case "dayTime": {
        const dayBounds = getDayBounds();
        if (dayBounds === undefined) {
          percentCompletion = 1;
          break;
        }
        const currentDay = new Date(state.calendar.now);
        const millisecondsAfterMidnight =
          currentDay.getHours() * 60 * 60 * 1000 +
          currentDay.getMinutes() * 60 * 1000 +
          currentDay.getSeconds() * 1000 +
          currentDay.getMilliseconds();
        percentCompletion =
          (millisecondsAfterMidnight - dayBounds.start) / (dayBounds.end - dayBounds.start);
        break;
      }
      default:
        throw new TypeError("Read invalid input from state countdown.");
    }
    updateProgressBar(percentCompletion);
  } catch (error) {
    console.error(error);
  }
}
