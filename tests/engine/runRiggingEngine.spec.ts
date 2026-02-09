import { runRiggingEngine } from "../../src/engine";

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — baseline behavior
 * ---------------------------------------------------------------------
 * These tests validate correct behavior for safe, valid lift geometry.
 * No warnings, no blocking — pure calculation verification.
 */

describe("runRiggingEngine — baseline behavior", () => {
  it("calculates equal sling tension for a symmetric 2-leg lift", () => {
    const result = runRiggingEngine({
      loadWeightLb: 10000,

      pickPoints: [
        { x: -5, y: 0, z: 0 },
        { x:  5, y: 0, z: 0 }
      ],

      slingLengthFt: 10,

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    expect(result.legs).toHaveLength(2);

    expect(result.legs[0].tensionLb)
      .toBeCloseTo(result.legs[1].tensionLb, 1);

    expect(result.governingSummary)
      .toContain("This is what limits the lift");
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — safety enforcement
 * ---------------------------------------------------------------------
 * These tests verify that unsafe geometry is BLOCKED outright.
 * No derating, no warnings — calculation must fail hard.
 */

describe("runRiggingEngine — safety enforcement", () => {
  it("blocks a lift when bottom sling angle is below the minimum allowed", () => {
    const badInput = {
      loadWeightLb: 12000,

      pickPoints: [
        { x: -10, y: 0, z: 0 },
        { x:  10, y: 0, z: 0 }
      ],

      slingLengthFt: 12,

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    };

    /**
     * Geometry produces a bottom sling angle below the allowed minimum.
     * This configuration must be rejected outright.
     */

    expect(() => runRiggingEngine(badInput)).toThrow(
      "Invalid bottom rigging configuration"
    );
  });
});