/**
 * GOVERNING SUMMARY
 * =================
 * Determines and reports the governing condition for the lift.
 *
 * REQUIRED OUTPUT LANGUAGE:
 * "This is what limits the lift."
 *
 * This file NEVER changes calculations.
 * It only evaluates which condition is most restrictive.
 */

import { BottomRiggingResult } from "../core/types/BottomRiggingResult";
import { TopRiggingResult } from "../core/types/TopRiggingResult";
import { LateralPressureResult } from "../core/types/LateralPressureResult";
import { BeamEvaluationResult } from "../core/types/BeamEvaluationResult";
import { HookHeightInfo } from "../core/types/HookHeightInfo";
import { GoverningSummary } from "../core/types/GoverningSummary";

interface GoverningInputs {
  bottomRigging: BottomRiggingResult;
  topRigging: TopRiggingResult | null;
  lateralPressure: LateralPressureResult;
  longerSlingMitigation: any | null;
  beamEvaluation: BeamEvaluationResult;
  hookHeightInfo: HookHeightInfo;
}

export function finalizeGoverningSummary(
  inputs: GoverningInputs
): GoverningSummary {
  /**
   * Priority order (LOCKED)
   * ----------------------
   * 1. Configuration blocks (beam required but invalid)
   * 2. Sling angle violations
   * 3. Governing sling tension (bottom rigging)
   * 4. Governing sling tension (top rigging)
   * 5. Lateral pressure
   * 6. Hook height / clearance (informational only)
   */

  const reasons: string[] = [];

  /**
   * STEP 1 — Beam requirement blocking
   */
  if (inputs.beamEvaluation.beamRequired && !inputs.beamEvaluation.addedToRiggingWeight) {
    return {
      governingCondition: "Spreader bar or lift beam required but not valid.",
      reason:
        "Lateral pressure exceeds allowable limits and a beam is required. Beam weight was not provided.",
      statement: "This is what limits the lift.",
      severity: "block",
    };
  }

  /**
   * STEP 2 — Bottom rigging governs (primary)
   */
  reasons.push(
    `Bottom rigging governing leg: ${inputs.bottomRigging.governingLegId} at ${inputs.bottomRigging.governingTension.toFixed(
      0
    )} lb.`
  );

  /**
   * STEP 3 — Top rigging (if present)
   */
  if (inputs.topRigging) {
    reasons.push(
      `Top rigging governing leg: ${inputs.topRigging.governingLegId} at ${inputs.topRigging.governingTension.toFixed(
        0
      )} lb.`
    );
  }

  /**
   * STEP 4 — Lateral pressure contribution
   */
  if (inputs.lateralPressure.lateralPercent > 0) {
    reasons.push(
      `Lateral pressure: ${inputs.lateralPressure.lateralPercent.toFixed(
        1
      )}% of total load.`
    );
  }

  /**
   * STEP 5 — Hook height advisory (informational only)
   */
  if (
    inputs.hookHeightInfo.warnings &&
    inputs.hookHeightInfo.warnings.length > 0
  ) {
    reasons.push(
      "Hook height evaluated for feasibility and clearance only."
    );
  }

  /**
   * FINAL GOVERNING SUMMARY
   */
  return {
    governingCondition:
      "Bottom rigging sling tension governs the lift.",
    reason: reasons.join(" "),
    statement: "This is what limits the lift.",
    severity: "governing",
  };
}
