/**
 * LATERAL PRESSURE EVALUATION
 * ==========================
 * Evaluates horizontal (side) force induced by sling geometry.
 *
 * RULES (LOCKED):
 * - Ideal lateral pressure = 0%
 * - >0% and ≤10% → warning
 * - >10% → automatic mitigation required
 * - Longer sling alternatives evaluated up to 40 ft
 * - If ≤10% cannot be achieved → spreader bar or lift beam REQUIRED
 */

import { EngineInput } from "../core/types/EngineInput";
import { BottomRiggingResult } from "../core/types/BottomRiggingResult";
import { LateralPressureResult } from "../core/types/LateralPressureResult";

import { calculateLateralForce } from "../core/forces/calculateLateralForce";
import { recalculateGeometryWithLongerSlings } from "../core/geometry/recalculateWithLongerSlings";

const MAX_ACCEPTABLE_PERCENT = 10;
const MAX_SLING_LENGTH_FT = 40;

export function evaluateLateralPressure(
  input: EngineInput,
  bottomRigging: BottomRiggingResult
): LateralPressureResult {
  const totalLoad = input.load.weight;

  /**
   * STEP 1 — Calculate lateral force for governing leg
   */
  const governingLeg = bottomRigging.legs.find(
    (l) => l.legId === bottomRigging.governingLegId
  );

  if (!governingLeg) {
    throw new Error("Governing leg not found for lateral pressure evaluation.");
  }

  const lateralForce = calculateLateralForce({
    tension: governingLeg.tension,
    angleFromHorizontal: governingLeg.angleFromHorizontal,
  });

  const lateralPercent = (lateralForce / totalLoad) * 100;

  /**
   * STEP 2 — Ideal or acceptable condition
   */
  if (lateralPercent <= MAX_ACCEPTABLE_PERCENT) {
    return {
      lateralForce,
      lateralPercent,
      status:
        lateralPercent === 0
          ? "ideal"
          : "acceptable-with-warning",
      mitigationRequired: false,
      evaluatedAlternatives: [],
    };
  }

  /**
   * STEP 3 — Automatic mitigation: longer slings
   */
  const alternatives = [];

  for (
    let slingLength = governingLeg.sling.minimumLength + 1;
    slingLength <= MAX_SLING_LENGTH_FT;
    slingLength++
  ) {
    const recalculated = recalculateGeometryWithLongerSlings({
      originalLeg: governingLeg,
      newSlingLength: slingLength,
    });

    const newLateralForce = calculateLateralForce({
      tension: recalculated.tension,
      angleFromHorizontal: recalculated.angleFromHorizontal,
    });

    const newPercent = (newLateralForce / totalLoad) * 100;

    alternatives.push({
      slingLength,
      angleFromHorizontal: recalculated.angleFromHorizontal,
      tension: recalculated.tension,
      lateralForce: newLateralForce,
      lateralPercent: newPercent,
    });

    if (newPercent <= MAX_ACCEPTABLE_PERCENT) {
      return {
        lateralForce,
        lateralPercent,
        status: "mitigated-with-longer-slings",
        mitigationRequired: true,
        selectedAlternative: alternatives[alternatives.length - 1],
        evaluatedAlternatives: alternatives,
        caution:
          "Longer slings increase hook height and require block clearance verification.",
      };
    }
  }

  /**
   * STEP 4 — Mitigation failed → beam required
   */
  return {
    lateralForce,
    lateralPercent,
    status: "exceeds-limit",
    mitigationRequired: true,
    evaluatedAlternatives: alternatives,
    beamRequired: true,
    failureReason:
      "Lateral pressure exceeds 10% and cannot be reduced within 40 ft sling length cap.",
  };
}
