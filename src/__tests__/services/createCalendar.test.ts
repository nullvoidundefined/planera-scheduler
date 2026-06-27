import { createCalendar } from "../../services/createCalendar";

const calendar = createCalendar({ epoch: "2026-01-05", holidays: ["2026-01-07"] }); // 2026-01-05 is a Monday

test("skips weekends when adding working days", () => {
    // Mon +1 working day, no holiday yet -> Tue
    expect(calendar.addWorkingDays(new Date("2026-01-05"), 1)).toEqual(new Date("2026-01-06"));
});

test("skips a holiday", () => {
    // Mon +2 working days; Wed 01-07 is a holiday, so land on Thu 01-08
    expect(calendar.addWorkingDays(new Date("2026-01-05"), 2)).toEqual(new Date("2026-01-08"));
});

test("index round-trips through dates skipping non-working days", () => {
    // index 0 = Mon 01-05, index 1 = Tue 01-06, index 2 = Thu 01-08 (Wed holiday skipped)
    expect(calendar.dateFromIndex(2)).toEqual(new Date("2026-01-08"));
    expect(calendar.indexFromDate(new Date("2026-01-08"))).toBe(2);
});

test("indexFromDate round-trips with dateFromIndex for a known working-day index", () => {
    // index 3 = Fri 01-09 (Mon 01-05 is 0, Tue 01-06 is 1, Thu 01-08 is 2, Fri 01-09 is 3)
    expect(calendar.indexFromDate(calendar.dateFromIndex(3))).toBe(3);
});

test("indexFromDate throws for a non-working day (Saturday 2026-01-10)", () => {
    expect(() => calendar.indexFromDate(new Date("2026-01-10"))).toThrow();
});

test("indexFromDate throws for a date before the epoch's first working day", () => {
    expect(() => calendar.indexFromDate(new Date("2025-12-01"))).toThrow();
});
