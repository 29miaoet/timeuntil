import { afterEach, expect, test, vi } from "vitest";
import { getCalendar } from "./fetchCalendar";

afterEach(() => vi.unstubAllGlobals());

function mockEvents(Events: Array<Record<string, string>>) {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ Events }),
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

test("creates an ordered inclusive UTC calendar and posts the correct school ID", async () => {
  const fetch = mockEvents([]);
  const calendar = await getCalendar("archwood");
  const dates = Object.keys(calendar);
  expect(dates[0]).toBe("2026-09-05");
  expect(dates.at(-1)).toBe("2027-06-30");
  expect(dates).toEqual([...dates].sort());
  expect(calendar["2026-09-05"].hasSchool).toBe(false);
  expect(calendar["2026-09-07"].hasSchool).toBe(true);
  const [url, request] = fetch.mock.calls[0];
  expect(url).toContain("/archwood");
  expect(request.method).toBe("POST");
  const payload = JSON.parse(request.body.get("ansp"));
  expect(JSON.parse(payload.Parameters.json).SiteId).toBe(38);
});

test("multi-day closures override early dismissal without duplicate holiday titles", async () => {
  const closure = {
    Title: "No School",
    StartTime: "2026-09-07T00:00:00Z",
    EndTime: "2026-09-08T23:59:59Z",
  };
  mockEvents([
    { Title: "Early dismissal", StartTime: "2026-09-07" },
    closure,
    closure,
    { Title: "Early dismissal", StartTime: "2026-09-08" },
  ]);
  const calendar = await getCalendar("archwood");
  for (const date of ["2026-09-07", "2026-09-08"]) {
    expect(calendar[date].hasSchool).toBe(false);
    expect(calendar[date].status).toBe("No School");
    expect(calendar[date].timeSlot).toBe("Regular");
    expect(calendar[date].holidays).toEqual(["No School"]);
  }
  expect(calendar["2026-09-09"].hasSchool).toBe(true);
});

test("a return-from-break event remains a school day", async () => {
  mockEvents([{ Title: "Classes resume after winter break", StartTime: "2026-09-07" }]);
  const calendar = await getCalendar("archwood");
  expect(calendar["2026-09-07"].hasSchool).toBe(true);
  expect(calendar["2026-09-07"].holidays).toEqual([]);
});

test("HTTP failures propagate instead of producing a misleading calendar", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  await expect(getCalendar("archwood")).rejects.toThrow("HTTP error! status: 503");
});

test("unknown schools fail before any network request", async () => {
  const fetch = mockEvents([]);
  await expect(getCalendar("not-a-school")).rejects.toThrow("not-a-school does not exist.");
  expect(fetch).not.toHaveBeenCalled();
});
