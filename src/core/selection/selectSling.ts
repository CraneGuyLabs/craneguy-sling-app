/**
 * SELECT SLING
 * ============
 * Selects minimum compliant sling and recommended sling
 * based on required tension and locked material rules.
 *
 * RULES (LOCKED):
 * - Minimum WLL ≥ calculated tension
 * - Recommended WLL ≥ 1.5× calculated tension
 * - Material preference:
 *   1) Synthetic round slings
 *   2) Wire rope slings (steel chokers)
 *   3) Chain slings
 * - Sharp edges override synthetic preference
 */

import {
  SyntheticRoundSling,
  WireRopeSling,
  ChainSling,
} from "../tables/slingTables";

interface SelectSlingInput {
  /**
   * Calculated sling tension (lb)
   */
  requiredTension: number;

  /**
   * Sharp edges present at contact point
   */
  sharpEdgePresent: boolean;
}

interface SlingSelectionResult {
  type: "synthetic" | "wire_rope" | "chain";
  minimumWLL: number;
  recommendedWLL: number;
  selectedSize: string;
  recommendedSize: string;
}

export function selectSling({
  requiredTension,
  sharpEdgePresent,
}: SelectSlingInput): SlingSelectionResult {
  if (requiredTension <= 0) {
    throw new Error("Required tension must be greater than zero.");
  }

  const recommendedTension = requiredTension * 1.5;

  /**
   * Determine material evaluation order
   */
  const materialOrder = sharpEdgePresent
    ? ["wire_rope", "chain"]
    : ["synthetic", "wire_rope", "chain"];

  for (const material of materialOrder) {
    let table;

    if (material === "synthetic") table = SyntheticRoundSling;
    if (material === "wire_rope") table = WireRopeSling;
    if (material === "chain") table = ChainSling;

    if (!table) continue;

    const minimum = table.find(
      (row) => row.wll >= requiredTension
    );
    const recommended = table.find(
      (row) => row.wll >= recommendedTension
    );

    if (minimum && recommended) {
      return {
        type: material as SlingSelectionResult["type"],
        minimumWLL: minimum.wll,
        recommendedWLL: recommended.wll,
        selectedSize: minimum.size,
        recommendedSize: recommended.size,
      };
    }
  }

  throw new Error(
    "No compliant sling found for the required tension."
  );
}
