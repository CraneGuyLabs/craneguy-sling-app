/**
 * SELECT SHACKLE
 * ==============
 * Selects the minimum compliant CARBON STEEL shackle
 * based on applied load and/or sling WLL.
 *
 * RULES (LOCKED):
 * - Carbon steel shackles ONLY
 * - 5:1 design factor
 * - Minimum size: 0.5 ton
 * - 1.25× connection factor ONLY when sizing from tension
 * - NO additional safety factors
 * - Shackle WLL ≥ governing load
 */

import { CarbonSteelShackle } from "../tables/shackleTable";

interface SelectShackleInput {
  /**
   * Calculated sling tension applied to the shackle (lb)
   */
  appliedLoad: number;

  /**
   * Sling minimum WLL (lb)
   * Used when the shackle must match sling capacity
   */
  slingWLL: number;
}

interface ShackleSelectionResult {
  nominalSize: string;
  wll: number;
  weight: number;
}

export function selectShackle({
  appliedLoad,
  slingWLL,
}: SelectShackleInput): ShackleSelectionResult {
  if (appliedLoad <= 0) {
    throw new Error(
      "Applied load must be greater than zero for shackle selection."
    );
  }

  if (slingWLL <= 0) {
    throw new Error(
      "Sling WLL must be greater than zero for shackle selection."
    );
  }

  /**
   * STEP 1 — Determine governing load
   * ---------------------------------
   * - Apply 1.25× ONLY when sizing from tension
   * - No factor applied when sizing from sling WLL
   */
  const tensionBasedRequirement = appliedLoad * 1.25;
  const governingLoad = Math.max(
    tensionBasedRequirement,
    slingWLL
  );

  /**
   * STEP 2 — Select minimum compliant shackle
   */
  const shackle = CarbonSteelShackle.find(
    (row) => row.wll >= governingLoad
  );

  if (!shackle) {
    throw new Error(
      "No compliant carbon steel shackle found for the governing load."
    );
  }

  /**
   * STEP 3 — Enforce minimum size (0.5 ton)
   */
  if (shackle.tonnage < 0.5) {
    throw new Error(
      "Selected shackle is below the minimum allowed size of 0.5 ton."
    );
  }

  return {
    nominalSize: shackle.size,
    wll: shackle.wll,
    weight: shackle.weight,
  };
}
