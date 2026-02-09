/**
 * CALCULATE SLING ANGLE (FROM HORIZONTAL)
 * ======================================
 * Resolves sling angle using true geometry.
 *
 * DEFINITION (LOCKED):
 * Sling angle is measured from a horizontal reference line
 * at the pick point, parallel to the pick-to-pick direction.
 *
 * This function:
 * - Does NOT apply safety limits
 * - Does NOT enforce minimum angles
 * - Does NOT assume symmetry
 */

interface SlingAngleInput {
  /**
   * Vertical rise from pick point to bearing point (ft)
   */
  verticalRise: number;

  /**
   * Horizontal distance from pick point to hook or bar centerline (ft)
   */
  horizontalOffset: number;
}

export function calculateSlingAngle({
  verticalRise,
  horizontalOffset,
}: SlingAngleInput): number {
  if (verticalRise <= 0) {
    throw new Error(
      "Vertical rise must be greater than zero to calculate sling angle."
    );
  }

  if (horizontalOffset < 0) {
    throw new Error(
      "Horizontal offset cannot be negative."
    );
  }

  /**
   * Angle from horizontal:
   * tan(θ) = vertical / horizontal
   */
  const radians = Math.atan2(
    verticalRise,
    horizontalOffset
  );

  const degrees = (radians * 180) / Math.PI;

  return degrees;
}
