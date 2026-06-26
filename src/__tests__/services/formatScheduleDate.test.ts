import { createCalendar } from "../../services/createCalendar";
import { DATE_FORMAT_OPTIONS, DISPLAY_DATE_LOCALE } from "../../constants/calendarDisplay";
import { formatScheduleDate } from "../../services/formatScheduleDate";

const calendar = createCalendar({ epoch: "2026-01-05" }); // 2026-01-05 is a Monday

test("index 0 returns the formatted epoch date", () => {
    const expected = new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, DATE_FORMAT_OPTIONS).format(
        new Date("2026-01-05"),
    );
    expect(formatScheduleDate(0, calendar)).toBe(expected);
});

test("index 1 returns the formatted next working day", () => {
    const expected = new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, DATE_FORMAT_OPTIONS).format(
        new Date("2026-01-06"),
    );
    expect(formatScheduleDate(1, calendar)).toBe(expected);
});

test("timezone robustness: index 0 contains year and day regardless of host TZ", () => {
    const result = formatScheduleDate(0, calendar);
    expect(result).toContain("2026");
    expect(result).toContain("5");
});
