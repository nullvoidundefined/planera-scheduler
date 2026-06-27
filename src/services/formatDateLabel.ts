/**
 * Formats a real Date into the compact display label shared by every schedule
 * surface. Owns the single Intl.DateTimeFormat instance (UTC-safe) so the DHTMLX
 * grid columns, which hold dates as Date objects, and formatScheduleDate, which
 * derives them from working-day indices, render dates identically.
 */
import { DATE_FORMAT_OPTIONS, DISPLAY_DATE_LOCALE } from "../constants/calendarDisplay";

const dateFormatter = new Intl.DateTimeFormat(DISPLAY_DATE_LOCALE, DATE_FORMAT_OPTIONS);

export function formatDateLabel(date: Date): string {
    return dateFormatter.format(date);
}
