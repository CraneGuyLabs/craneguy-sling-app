/**
 * BOTTOM RIGGING EVALUATION
 * ========================
 * Authoritative evaluation of all rigging BELOW the hook or beam.
 *
 * This module establishes:
 * - Sling geometry per leg
 * - Sling angles (from horizontal)
 * - Tension per leg
 * - Governing leg
 * - Minimum required WLL
 * - Recommended WLL (≥1.5×)
 *
 * This output is immutable and drives all downstream logic.
 */

import { EngineInput } from "../core/types/EngineInput";
import { BottomRiggingResult } from "../core/types/BottomRiggingResult";

import { calculateSlingAngle } from "../core/geometry/calculateSlingAngle";
import { calculateSlingTension } from "../core/forces/calculateSlingTension";
import { selectSling } from "../core/selection/selectSling";
import { selectShackle } from "../core/selection/selectShackle";

export function evaluateBottomRigging(
  input: EngineInput
): BottomRiggingResult {
  const results = [];

  /**
   * Configuration-specific minimum angle rules (LOCKED)
   * ----------------------------------------------------
   * Bottom-of-hook OR bottom-of-beam connections:
   *   > 45° from horizontal
   */
  const MIN_ANGLE_DEGREES = 45;

  for (const leg of input.bottomRigging.legs) {
    /**
     * STEP 1 — Sling Angle (from horizontal)
     */
    const angle = calculateSlingAngle({
      pickPoint: leg.pickPoint,
      slingLength: leg.slingLength,
    });

    if (angle <= MIN_ANGLE_DEGREES) {
      throw new Error(
        `Invalid bottom rigging configuration: sling angle ${angle.toFixed(
          1
        )}° is below the minimum allowed ${MIN_ANGLE_DEGREES}°`
      );
    }

    /**
     * STEP 2 — Sling Tension (per leg)
     */
    const tension = calculateSlingTension({
      loadShare: leg.loadShare,
      angleFromHorizontal: angle,
    });

    /**
     * STEP 3 — Sling Selection
     * ------------------------
     * - Minimum WLL ≥ calculated tension
     * - Recommended WLL ≥ 1.5× tension
     * - Material preference rules enforced upstream
     */
    const slingSelection = selectSling({
      requiredTension: tension,
      sharpEdgePresent: input.conditions.sharpEdgesPresent,
    });

    /**
     * STEP 4 — Shackle Selection (LOCKED RULES)
     * -----------------------------------------
     * - Carbon steel shackles ONLY
     * - 5:1 design factor
     * - 1.25× connection factor ONLY when sizing from tension
     * - NO additional multipliers
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
   * STEP 5 — Governing Leg Determination
   * -----------------------------------
   * The leg with the highest applied tension governs.
   */
  const governingLeg = results.reduce((prev, current) =>
    current.tension > prev.tension ? current : prev
  );

  return {
    legs: results,
    governingLegId: governingLeg.legId,
    governingTension: governingLeg.tension,
    governingReason:
      "Highest calculated sling tension governs bottom rigging.",
  };
}
