/**
 * SLING APP – ENGINE ENTRY
 * =======================
 * This is the ONLY authoritative execution entry for the Sling App engine.
 *
 * Responsibilities:
 * - Normalize and validate inputs
 * - Enforce locked rule order
 * - Orchestrate geometry → tension → selection → validation → warnings
 * - Produce a frozen, deterministic output
 *
 * Prohibited:
 * - No math tables
 * - No geometry formulas
 * - No UI logic
 * - No shortcuts or overrides
 */

import { normalizeInputs } from "../core/normalizeInputs";
import { evaluateBottomRigging } from "./evaluateBottomRigging";
import { evaluateTopRigging } from "./evaluateTopRigging";
import { evaluateLateralPressure } from "./evaluateLateralPressure";
import { evaluateLongerSlingMitigation } from "./evaluateLongerSlingMitigation";
import { evaluateSpreaderOrBeamRequirement } from "./evaluateSpreaderOrBeamRequirement";
import { evaluateHookHeightInfo } from "./evaluateHookHeightInfo";
import { finalizeGoverningSummary } from "./finalizeGoverningSummary";

import { EngineInput } from "../core/types/EngineInput";
import { EngineOutput } from "../core/types/EngineOutput";

export function runRiggingEngine(input: EngineInput): EngineOutput {
  /**
   * STEP 0 — Normalize Inputs
   * ------------------------
   * - Unit normalization
   * - Geometry references locked (pick-point reference rules)
   * - Hidden hardware geometry adjustments applied automatically
   */
  const normalized = normalizeInputs(input);

  /**
   * STEP 1 — Bottom Rigging Evaluation (Authoritative)
   * --------------------------------------------------
   * - Geometry → sling angle
   * - Tension per leg
   * - Minimum required WLL
   * - Recommended WLL (≥1.5×)
   * - Configuration-specific minimum angle enforcement
   */
  const bottomRigging = evaluateBottomRigging(normalized);

  /**
   * STEP 2 — Lateral Pressure Evaluation
   * -----------------------------------
   * - Zero is ideal
   * - ≤10% → warning
   * - >10% → automatic mitigation required
   */
  const lateralPressure = evaluateLateralPressure(bottomRigging);

  /**
   * STEP 3 — Automatic Longer Sling Mitigation
   * -------------------------------------------
   * - Evaluated only if lateral pressure exceeds limits
   * - Sling length capped at 40 ft (hard rule)
   * - Recomputes angles, tensions, and lateral force
   */
  const longerSlingMitigation =
    lateralPressure.requiresMitigation
      ? evaluateLongerSlingMitigation(bottomRigging)
      : null;

  /**
   * STEP 4 — Spreader Bar / Lift Beam Requirement
   * ---------------------------------------------
   * - Triggered if lateral pressure cannot be mitigated ≤10%
   * - Requires:
   *   - Beam WLL
   *   - Actual beam weight (mandatory)
   * - Blocks configuration if beam weight is missing
   */
  const beamEvaluation = evaluateSpreaderOrBeamRequirement(
    bottomRigging,
    longerSlingMitigation
  );

  /**
   * STEP 5 — Top Rigging Evaluation (Independent)
   * ---------------------------------------------
   * - Load sharing allowed
   * - Per-sling geometry rules enforced
   * - ≥60° minimum angle from horizontal
   * - Governing leg determination
   */
  const topRigging = evaluateTopRigging(
    normalized,
    beamEvaluation
  );

  /**
   * STEP 6 — Hook Height (Informational Only)
   * -----------------------------------------
   * - NEVER drives sling geometry or selection
   * - Clearance and block warnings only
   */
  const hookHeightInfo = evaluateHookHeightInfo(
    normalized,
    bottomRigging,
    topRigging
  );

  /**
   * STEP 7 — Governing Summary
   * -------------------------
   * - "This is what limits the lift."
   * - Explicit identification of the governing condition
   */
  const governingSummary = finalizeGoverningSummary({
    bottomRigging,
    topRigging,
    lateralPressure,
    longerSlingMitigation,
    beamEvaluation,
    hookHeightInfo,
  });

  /**
   * FINAL — Frozen Engine Output
   * ----------------------------
   * - Deterministic
   * - Fully traceable
   * - Field-use ready
   */
  return {
    input: normalized,
    bottomRigging,
    lateralPressure,
    longerSlingMitigation,
    beamEvaluation,
    topRigging,
    hookHeightInfo,
    governingSummary,
    disclaimer:
      "Load acceptability and lug integrity are the user’s responsibility.",
  };
}
