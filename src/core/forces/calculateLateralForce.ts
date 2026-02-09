/**
 * CALCULATE LATERAL (HORIZONTAL) FORCE
 * ==================================
 * Resolves the horizontal force component induced by a sling.
 *
 * FORMULA (LOCKED):
 * F_horizontal = T × cos(θ)
 *
 * Where:
 * - T = sling tension (lb)
 * - θ = sling angle from horizontal (degrees)
 *
 * This value is used to evaluate lateral pressure as a
 * percentage of total applied load.
 */

interface LateralForceInput {
  /**
   * Sling tension (lb)
   */
  tension: number;

  /**
   * Sling angle measured from horizontal (degrees)
   */
  angleFromHorizontal: number;
}

export function calculateLateralForce({
  tension,
  angleFromHorizontal,
}: LateralForceInput): number {
  if (tension <= 0) {
    throw new Error(
      "Sling tension must be greater than zero to calculate lateral force."
    );
  }

  if (angleFromHorizontal < 0 || angleFromHorizontal > 90) {
    throw new Error(
      "Sling angle must be between 0° and 90° to calculate lateral force."
    );
  }

  const radians = (angleFromHorizontal * Math.PI) / 180;

  const lateralForce = tension * Math.cos(radians);

  return lateralForce;
}
