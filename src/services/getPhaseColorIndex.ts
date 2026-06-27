/**
 * Maps each schedule phase to a 0-based pastel color index. Phases are the group
 * activities nested under a project (type "group" with a non-null parentId); they
 * are enumerated in their natural schedule order and assigned indices that cycle
 * through the palette (position % PHASE_PALETTE_SIZE). The map is derived from the
 * full activity list so a phase keeps its color whether or not it is collapsed, and
 * both views resolve a phase id to its hue through this one source of truth.
 */
import { PHASE_PALETTE_SIZE } from "../constants/phasePaletteSize";
import type { Activity } from "../types/schedule";

export function getPhaseColorIndex(activities: Activity[]): Map<string, number> {
    const phaseColorIndex = new Map<string, number>();
    let position = 0;
    for (const activity of activities) {
        if (activity.type === "group" && activity.parentId !== null) {
            phaseColorIndex.set(activity.id, position % PHASE_PALETTE_SIZE);
            position += 1;
        }
    }
    return phaseColorIndex;
}
