/**
 * Computes the candidate early-start day index for a successor activity given
 * one of its predecessor edges. Called during the forward pass of the CPM
 * engine for each (FS/SS/FF/SF) dependency that constrains the successor.
 */
import type { Dependency } from "../../types/schedule";

export function earlyStartFromDependency(
    dependency: Dependency,
    predecessorEarlyStart: number,
    predecessorEarlyFinish: number,
    activityDuration: number,
): number {
    switch (dependency.type) {
        case "FS":
            return predecessorEarlyFinish + dependency.lagDays;
        case "SS":
            return predecessorEarlyStart + dependency.lagDays;
        case "FF":
            return predecessorEarlyFinish + dependency.lagDays - activityDuration;
        case "SF":
            return predecessorEarlyStart + dependency.lagDays - activityDuration;
    }
}
