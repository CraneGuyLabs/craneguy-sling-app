/**
 * SPREADER BAR / LIFT BEAM REQUIREMENT
 * ==================================
 * Determines when a spreader bar or lift beam is mandatory and validates
 * required beam inputs.
 *
 * RULES (LOCKED):
 * - Beam required if lateral pressure cannot be mitigated ≤10%
 * - Actual beam weight is MANDATORY
 * - Estimated beam weights are NOT allowed
 * - Beam weight must be added to total rigging load
 */

import { BottomRiggingResult } from "../core/types/BottomRiggingResult";
import { LateralPressureResult } from "../core/types/LateralPressureResult";
import { BeamEvaluationResult } from "../core/types/BeamEvaluationResult";

export function evaluateSpreaderOrBeamRequirement(
  bottomRigging: BottomRiggingResult,
  lateralPressure: LateralPressureResult | null
): BeamEvaluationResult {
  /**
   * STEP 1 — Determine if beam is required
   */
  const beamRequired =
    lateralPressure?.beamRequired === true;

  if (!beamRequired) {
    return {
      beamRequired: false,
      beamWeight: 0,
      addedToRiggingWeight: false,
    };
  }

  /**
   * STEP 2 — Validate beam input
   */
  const beam = bottomRigging.beam;

  if (!beam) {
    throw new Error(
      "Spreader bar or lift beam is required, but no beam data was provided."
    );
  }

  if (
    beam.weight === undefined ||
    beam.weight === null ||
    beam.weight <= 0
  ) {
    throw new Error(
      "Spreader bar or lift beam weight is mandatory and must be provided. Estimated weights are not permitted."
    );
  }

  /**
   * STEP 3 — Return validated beam result
   */
  return {
    beamRequired: true,
    beamType: beam.type,
    beamWLL: beam.wll,
    beamWeight: beam.weight,
    addedToRiggingWeight: true,
    governingReason:
      "Beam required to control lateral pressure exceeding allowable limits.",
  };
}
