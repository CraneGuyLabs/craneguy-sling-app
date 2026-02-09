/**
 * HOOK HEIGHT & CLEARANCE (INFORMATIONAL ONLY)
 * ==========================================
 * Calculates hook height and evaluates clearance constraints.
 *
 * IMPORTANT:
 * - Hook height NEVER governs sling geometry or selection.
 * - All outputs are warnings or informational flags only.
 */

import { EngineInput } from "../core/types/EngineInput";
import { BottomRiggingResult } from "../core/types/BottomRiggingResult";
import { TopRiggingResult } from "../core/types/TopRiggingResult";
import { HookHeightInfo } from "../core/types/HookHeightInfo";

import { calculateHookHeight } from "../core/geometry/calculateHookHeight";

export function evaluateHookHeightInfo(
  input: EngineInput,
  bottomRigging: BottomRiggingResult,
  topRigging: TopRiggingResult | null
): HookHeightInfo {
  /**
   * STEP 1 — Calculate hook height
   * --------------------------------
   * Includes:
   * - Sling vertical rise
   * - Beam height (if used)
   * - Hardware stack-up (handled internally)
   */
  const hookHeight = calculateHookHeight({
    bottomRigging,
    topRigging,
  });

  const warnings: string[] = [];

  /**
   * STEP 2 — Compare against crane limits (if provided)
   */
  if (
    input.crane?.maxHookHeight !== undefined &&
    hookHeight > input.crane.maxHookHeight
  ) {
    warnings.push(
      `Calculated hook height (${hookHeight.toFixed(
        1
      )} ft) exceeds crane maximum hook height (${input.crane.maxHookHeight} ft).`
    );
  }

  /**
   * STEP 3 — Block / headroom clearance
   */
  if (
    input.crane?.blockClearance !== undefined &&
    hookHeight < input.crane.blockClearance
  ) {
    warnings.push(
      `Insufficient block or headroom clearance. Required clearance: ${input.crane.blockClearance} ft.`
    );
  }

  /**
   * STEP 4 — Advisory notice
   */
  if (warnings.length === 0) {
    warnings.push(
      "Hook height evaluated for informational purposes only. Sling geometry and selection remain independent of hook height."
    );
  }

  return {
    hookHeight,
    warnings,
    informationalOnly: true,
  };
}
