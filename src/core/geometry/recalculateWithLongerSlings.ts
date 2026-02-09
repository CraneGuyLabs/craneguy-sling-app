/**
 * RECALCULATE GEOMETRY WITH LONGER SLINGS
 * ======================================
 * Used ONLY for automatic lateral-pressure mitigation.
 *
 * This function recalculates:
 * - Sling angle (from horizontal)
 * - Sling tension
 * - Resulting lateral force
 *
 * All other parameters remain unchanged.
 */

import { calculateSlingAngle } from "./calculateSlingAngle";
import { calculateSlingTension } from "../forces/calculateSlingTension";

interface OriginalLeg {
  legId: string;
  loadShare: number;
  pickPoint: {
    verticalRise: number;
    horizontalOffset: number;
  };
}

interface RecalculateInput {
  originalLeg: OriginalLeg;
  newSlingLength: number;
}

interface RecalculatedLeg {
  legId: string;
  slingLength: number;
  angleFromHorizontal: number;
  tension: number;
}

export function recalculateGeometryWithLongerSlings({
  originalLeg,
  newSlingLength,
}: RecalculateInput): RecalculatedLeg {
  if (newSlingLength <= 0) {
    throw new Error("Sling length must be greater than zero.");
  }

  /**
   * Geometry is recomputed using the same horizontal offset
   * and a recalculated vertical rise.
   *
   * verticalRise = sqrt( slingLength² − horizontalOffset² )
   */
  const { horizontalOffset } = originalLeg.pickPoint;

  if (newSlingLength <= horizontalOffset) {
    throw new Error(
      "Sling length must exceed horizontal offset to form valid geometry."
    );
  }

  const verticalRise = Math.sqrt(
    Math.pow(newSlingLength, 2) -
      Math.pow(horizontalOffset, 2)
  );

  /**
   * STEP 1 — Recalculate angle
   */
  const angleFromHorizontal = calculateSlingAngle({
    verticalRise,
    horizontalOffset,
  });

  /**
   * STEP 2 — Recalculate tension
   */
  const tension = calculateSlingTension({
    loadShare: originalLeg.loadShare,
    angleFromHorizontal,
  });

  return {
    legId: originalLeg.legId,
    slingLength: newSlingLength,
    angleFromHorizontal,
    tension,
  };
}
