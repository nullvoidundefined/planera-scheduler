/**
 * Derives a deterministic, human-readable construction task name from a
 * leaf activity's structural position. The name encodes the building area
 * (from the lane index) and the specific task (from the position within the
 * lane and the project/phase context). When a lane cycles through its task
 * list more than once, a section qualifier distinguishes repeated tasks.
 */
import { AREAS, EXECUTION_TASKS, PHASE_TASKS } from "../constants/activityNaming";

const EXECUTION_PHASE_NAME = "Execution";

export function buildActivityName(
    projectName: string,
    phaseName: string,
    laneIndex: number,
    positionInLane: number,
): string {
    const area = AREAS[laneIndex % AREAS.length];
    const tasks =
        phaseName === EXECUTION_PHASE_NAME
            ? EXECUTION_TASKS[projectName]
            : PHASE_TASKS[phaseName];
    const task = tasks[positionInLane % tasks.length];
    const cycle = Math.floor(positionInLane / tasks.length);
    return cycle > 0 ? `${task}, ${area} (Sec. ${cycle + 1})` : `${task}, ${area}`;
}
