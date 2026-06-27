/**
 * Converts a working-day index to a compact display date string for use in
 * schedule table views. Delegates arithmetic to the Calendar and formatting to
 * the shared formatDateLabel helper so index-derived and Date-derived labels match.
 */

import type { Calendar } from "../types/calendar";

import { formatDateLabel } from "./formatDateLabel";

export function formatScheduleDate(index: number, calendar: Calendar): string {
    return formatDateLabel(calendar.dateFromIndex(index));
}
