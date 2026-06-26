/**
 * Converts a working-day index to a compact display date string for use in
 * schedule table views. Delegates arithmetic to the Calendar and formatting to
 * a shared Intl.DateTimeFormat instance configured for UTC-safe output.
 */

import { DATE_FORMAT_OPTIONS, DISPLAY_DATE_LOCALE } from "../constants/calendarDisplay";
import type { Calendar } from "../types/calendar";

const dateFormatter = new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, DATE_FORMAT_OPTIONS);

export function formatScheduleDate(index: number, calendar: Calendar): string {
    const date = calendar.dateFromIndex(index);
    return dateFormatter.format(date);
}
