/**
 * CALCULATE SLING TENSION
 * ======================
 * Computes sling leg tension from applied load share and sling angle.
 *
 * FORMULA (LOCKED):
 * T = W / sin(θ)
 *
 * Where:
 * - W = load carried by this sling leg (lb)
 * - θ = sling angle measured FROM HORIZONTAL (degrees)
 *
 * This function:
 * - Applies no safety factors
 * - Applies no reduction factors
 * - Assumes valid geometry
 */

interface SlingTensionInput {
  /**
   * Load carried by this sling leg (lb)
   */
  loadShare: number;

  /**
   * Sling angle measured from horizontal (degrees)
   */
  angleFromHorizontal: number;
}

export function calculateSlingTension({
  loadShare,
  angleFromHorizontal,
}: SlingTensionInput): number {
  if (loadShare <= 0) {
    throw new Error(
      "Load share must be greater than zero to calculate sling tension."
    );
  }

  if (angleFromHorizontal <= 0 || angleFromHorizontal >= 90) {
    throw new Error(
      "Sling angle must be between 0° and 90° (exclusive)."
    );
  }

  const radians = (angleFromHorizontal * Math.PI) / 180;

  const tension = loadShare / Math.sin(radians);

  return tension;
}
