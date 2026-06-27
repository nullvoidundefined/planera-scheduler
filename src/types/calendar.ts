/**
 * Calendar interface for working-day arithmetic. Provides conversion between
 * real dates and integer working-day indices, used by the CPM scheduling engine.
 */

export interface Calendar {
    addWorkingDays(start: Date, count: number): Date;
    dateFromIndex(index: number): Date;
    indexFromDate(date: Date): number;
    isWorkingDay(date: Date): boolean;
}
