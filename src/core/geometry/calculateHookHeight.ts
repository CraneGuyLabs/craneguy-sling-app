/**
 * CALCULATE HOOK HEIGHT (INFORMATIONAL ONLY)
 * =========================================
 * Computes hook height based on resolved rigging geometry.
 *
 * IMPORTANT (LOCKED):
 * - Hook height is NOT a governing input.
 * - This function must NEVER alter sling geometry or selection.
 * - Output is used ONLY for clearance and feasibility warnings.
 */

import { BottomRiggingResult } from "../types/BottomRiggingResult";
import { TopRiggingResult } from "../types/TopRiggingResult";

interface HookHeightInput {
  bottomRigging: BottomRiggingResult;
  topRigging: TopRiggingResult | null;
}

export function calculateHookHeight({
  bottomRigging,
  topRigging,
}: HookHeightInput): number {
  /**
   * STEP 1 — Bottom rigging vertical rise
   * ------------------------------------
   * The governing leg defines the maximum vertical rise requirement.
   */
  const governingBottomLeg = bottomRigging.legs.find(
    (l) => l.legId === bottomRigging.governingLegId
  );

  if (!governingBottomLeg) {
    throw new Error(
      "Governing bottom rigging leg not found for hook height calculation."
    );
  }

  const bottomVerticalRise =
    governingBottomLeg.sling.verticalRise;

  /**
   * STEP 2 — Add beam height if present
   */
  const beamHeight =
    bottomRigging.beam?.height ?? 0;

  /**
   * STEP 3 — Add top rigging vertical rise (if present)
   */
  let topVerticalRise = 0;

  if (topRigging) {
    const governingTopLeg = topRigging.legs.find(
      (l) => l.legId === topRigging.governingLegId
    );

    if (!governingTopLeg) {
      throw new Error(
        "Governing top rigging leg not found for hook height calculation."
      );
    }

    topVerticalRise =
      governingTopLeg.sling.verticalRise;
  }

  /**
   * STEP 4 — Total hook height
   */
  const hookHeight =
    bottomVerticalRise + beamHeight + topVerticalRise;

  return hookHeight;
}
