/**
 * ENGINE ENTRY — AUTHORITATIVE CALCULATION ORCHESTRATOR
 * -----------------------------------------------------
 * Project: CraneGuyLabs Sling App
 *
 * PURPOSE:
 * This file is the single entry point for all below-the-hook
 * rigging calculations. It orchestrates geometry resolution,
 * sling tension calculation, hardware sizing, safety checks,
 * and governing condition determination.
 *
 * RULE STATUS:
 * - Sling App Master Spec: FROZEN
 * - Below-the-hook logic ONLY
 * - Hook height is informational only (never governing)
 *
 * WARNING:
 * No UI, API, or validation layers may bypass this file.
 */

import { resolveGeometry } from "./geometry/resolveGeometry";
import { calculateSlingTensions } from "./tension/calculateSlingTensions";
import { selectSlings } from "./selection/selectSlings";
import { selectShackles } from "./selection/selectShackles";
import { evaluateAngles } from "./safety/evaluateAngles";
import { evaluateLateralPressure } from "./safety/evaluateLateralPressure";
import { evaluateHookHeight } from "./safety/evaluateHookHeight";
import { determineGoverningCondition } from "./governing/determineGoverningCondition";

import {
  EngineInput,
  EngineResult,
  EngineWarning,
  EngineError,
} from "../core/types";

/**
 * Primary Engine Entry Function
 */
export function runRiggingEngine(input: EngineInput): EngineResult {
  const warnings: EngineWarning[] = [];
  const errors: EngineError[] = [];

  /**
   * STEP 1 — Resolve Geometry
   * Includes:
   * - Pick point spacing
   * - Pick point height reference (TOP of load → lug CL)
   * - Sling length (calculated or user override)
   */
  const geometry = resolveGeometry(input, warnings, errors);

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  /**
   * STEP 2 — Calculate Sling Tensions (Per Leg)
   * - Load sharing allowed
   * - Governing leg determined by highest tension
   */
  const tensions = calculateSlingTensions(input, geometry, warnings);

  /**
   * STEP 3 — Angle Evaluation
   * - Bottom-of-hook or bottom-of-bar: >45°
   * - Top-of-bar or lift beam: ≥60°
   */
  evaluateAngles(input, geometry, tensions, warnings, errors);

  /**
   * STEP 4 — Lateral Pressure Evaluation
   * - 0% ideal
   * - ≤10% warning
   * - >10% triggers automatic mitigation
   * - Longer slings evaluated up to 40 ft max
   */
  evaluateLateralPressure(
    input,
    geometry,
    tensions,
    warnings,
    errors
  );

  /**
   * STEP 5 — Sling Selection
   * - Preference order:
   *   1) Synthetic round
   *   2) Wire rope (steel chokers)
   *   3) Chain
   * - Sharp-edge override supported
   * - Minimum WLL ≥ calculated tension
   * - Recommended sizing ≥ 1.5× tension
   */
  const slings = selectSlings(
    input,
    geometry,
    tensions,
    warnings,
    errors
  );

  /**
   * STEP 6 — Shackle Selection
   * - Carbon steel ONLY
   * - 5:1 design factor
   * - Minimum size: 0.5 ton
   * - 1.25× connection factor ONLY when sizing from tension
   * - NO additional factors applied
   */
  const shackles = selectShackles(
    input,
    slings,
    tensions,
    warnings,
    errors
  );

  /**
   * STEP 7 — Hook Height Evaluation (INFORMATIONAL ONLY)
   * - Does NOT affect sling geometry
   * - Validates block/headroom clearance
   */
  evaluateHookHeight(input, geometry, warnings);

  /**
   * STEP 8 — Governing Condition Determination
   * - Identifies what limits the lift
   */
  const governing = determineGoverningCondition({
    geometry,
    tensions,
    slings,
    shackles,
    warnings,
    errors,
  });

  /**
   * FINAL RESULT
   */
  return {
    valid: errors.length === 0,
    geometry,
    tensions,
    slings,
    shackles,
    governing,
    warnings,
    errors,
    disclaimer:
      "Load acceptability and lug integrity are the user’s responsibility.",
  };
}
