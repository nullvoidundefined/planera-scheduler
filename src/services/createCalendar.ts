/**
 * Factory for working-day calendar instances. Converts between real Date values
 * and integer working-day indices, skipping weekends and configured holidays.
 * Used as the arithmetic foundation for the CPM scheduling engine.
 */

import { DEFAULT_EPOCH, DEFAULT_WORK_WEEK, MILLISECONDS_PER_DAY } from "../constants/calendar";
import type { Calendar } from "../types/calendar";

export function createCalendar(options?: {
    epoch?: string;
    holidays?: string[];
    workWeek?: number[];
}): Calendar {
    const workWeek = options?.workWeek ?? DEFAULT_WORK_WEEK;
    const holidaySet = new Set(options?.holidays ?? []);
    const epochDate = new Date(options?.epoch ?? DEFAULT_EPOCH);
    const epochWorkingDay = findFirstWorkingDay(epochDate, workWeek, holidaySet);

    function isWorkingDay(date: Date): boolean {
        return workWeek.includes(date.getUTCDay()) && !holidaySet.has(toISODateString(date));
    }

    function addWorkingDays(start: Date, count: number): Date {
        let currentDate = start;
        let remaining = count;
        while (remaining > 0) {
            currentDate = addDays(currentDate, 1);
            if (isWorkingDay(currentDate)) {
                remaining--;
            }
        }
        return currentDate;
    }

    function dateFromIndex(index: number): Date {
        let currentDate = epochWorkingDay;
        for (let i = 0; i < index; i++) {
            do {
                currentDate = addDays(currentDate, 1);
            } while (!isWorkingDay(currentDate));
        }
        return currentDate;
    }

    function indexFromDate(date: Date): number {
        if (!isWorkingDay(date)) {
            throw new Error(`indexFromDate: ${toISODateString(date)} is not a working day`);
        }
        if (date.getTime() < epochWorkingDay.getTime()) {
            throw new Error(
                `indexFromDate: ${toISODateString(date)} is before the epoch's first working day (${toISODateString(epochWorkingDay)})`,
            );
        }
        let currentDate = epochWorkingDay;
        let index = 0;
        while (currentDate.getTime() < date.getTime()) {
            currentDate = addDays(currentDate, 1);
            if (isWorkingDay(currentDate)) {
                index++;
            }
        }
        return index;
    }

    return { addWorkingDays, dateFromIndex, indexFromDate, isWorkingDay };
}

function findFirstWorkingDay(
    from: Date,
    workWeek: readonly number[],
    holidaySet: Set<string>,
): Date {
    let currentDate = from;
    while (
        !workWeek.includes(currentDate.getUTCDay()) ||
        holidaySet.has(toISODateString(currentDate))
    ) {
        currentDate = addDays(currentDate, 1);
    }
    return currentDate;
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * MILLISECONDS_PER_DAY);
}

function toISODateString(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
