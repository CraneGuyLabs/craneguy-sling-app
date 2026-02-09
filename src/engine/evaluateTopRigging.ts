/**
 * TOP RIGGING EVALUATION
 * =====================
 * Independent evaluation of top-of-bar or top-of-beam rigging.
 *
 * RULES (LOCKED):
 * - Minimum sling angle: ≥ 60° from horizontal
 * - Load sharing allowed across multiple slings
 * - Per-leg geometry and tension evaluation
 * - Governing leg identified by highest tension
 */

import { EngineInput } from "../core/types/EngineInput";
import { TopRiggingResult } from "../core/types/TopRiggingResult";

import { calculateSlingAngle } from "../core/geometry/calculateSlingAngle";
import { calculateSlingTension } from "../core/forces/calculateSlingTension";
import { selectSling } from "../core/selection/selectSling";
import { selectShackle } from "../core/selection/selectShackle";

const MIN_TOP_ANGLE_DEGREES = 60;

export function evaluateTopRigging(
  input: EngineInput,
  beamEvaluation: any // beam presence/geometry is informational here
): TopRiggingResult | null {
  if (!input.topRigging || input.topRigging.legs.length === 0) {
    return null;
  }

  const results = [];

  for (const leg of input.topRigging.legs) {
    /**
     * STEP 1 — Sling Angle (from horizontal)
     */
    const angle = calculateSlingAngle({
      pickPoint: leg.pickPoint,
      slingLength: leg.slingLength,
    });

    if (angle < MIN_TOP_ANGLE_DEGREES) {
      throw new Error(
        `Invalid top rigging configuration: sling angle ${angle.toFixed(
          1
        )}° is below the minimum allowed ${MIN_TOP_ANGLE_DEGREES}°`
      );
    }

    /**
     * STEP 2 — Sling Tension (per leg)
     * Load sharing allowed, but tension is still evaluated individually.
     */
    const tension = calculateSlingTension({
      loadShare: leg.loadShare,
      angleFromHorizontal: angle,
    });

    /**
     * STEP 3 — Sling Selection
     * - Minimum WLL ≥ calculated tension
     * - Recommended WLL ≥ 1.5× tension
     */
    const slingSelection = selectSling({
      requiredTension: tension,
      sharpEdgePresent: input.conditions.sharpEdgesPresent,
    });

    /**
     * STEP 4 — Shackle Selection
     * - Carbon steel only
     * - 5:1 design factor
     * - 1.25× connection factor ONLY when sizing from tension
     */
    const shackleSelection = selectShackle({
      appliedLoad: tension,
      slingWLL: slingSelection.minimumWLL,
    });

    results.push({
      legId: leg.id,
      angleFromHorizontal: angle,
      tension,
      sling: slingSelection,
      shackle: shackleSelection,
    });
  }

  /**
   * STEP 5 — Governing Leg
   */
  const governingLeg = results.reduce((prev, current) =>
    current.tension > prev.tension ? current : prev
  );

  return {
    legs: results,
    governingLegId: governingLeg.legId,
    governingTension: governingLeg.tension,
    governingReason:
      "Highest calculated sling tension governs top rigging.",
  };
}
