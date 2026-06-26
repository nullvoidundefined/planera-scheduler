/**
 * Display constants for calendar date formatting used in schedule table views.
 * Centralises locale and Intl.DateTimeFormat options so all schedule surfaces
 * format dates identically.
 */

export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
};

export const DISPLAY_DATE_LOCALE = "en-US";
