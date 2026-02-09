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

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — governing leg determination
 * ---------------------------------------------------------------------
 * These tests verify that unequal geometry produces unequal tensions
 * and that the governing leg is correctly identified and reported.
 */

describe("runRiggingEngine — governing leg determination", () => {
  it("identifies the governing leg in an asymmetric 2-leg lift", () => {
    const result = runRiggingEngine({
      loadWeightLb: 8000,

      pickPoints: [
        { x: -3, y: 0, z: 0 },   // shorter horizontal distance
        { x:  7, y: 0, z: 0 }    // longer horizontal distance → flatter angle
      ],

      slingLengthFt: 10,

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    expect(result.legs).toHaveLength(2);

    const leftLeg  = result.legs[0];
    const rightLeg = result.legs[1];

    // Tensions must NOT be equal
    expect(leftLeg.tensionLb).not.toBeCloseTo(rightLeg.tensionLb, 1);

    // The leg with the flatter angle must govern
    expect(result.governingLegIndex).toBeDefined();
    expect(result.legs[result.governingLegIndex].tensionLb)
      .toBeGreaterThan(
        result.legs[1 - result.governingLegIndex].tensionLb
      );

    expect(result.governingSummary)
      .toContain("This is what limits the lift");
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — lateral pressure mitigation
 * ---------------------------------------------------------------------
 * These tests verify that excessive lateral pressure triggers
 * automatic longer-sling mitigation before requiring a bar.
 */

describe("runRiggingEngine — lateral pressure mitigation", () => {
  it("automatically evaluates longer slings when lateral pressure exceeds 10%", () => {
    const result = runRiggingEngine({
      loadWeightLb: 15000,

      pickPoints: [
        { x: -8, y: 0, z: 0 },
        { x:  8, y: 0, z: 0 }
      ],

      slingLengthFt: 8, // intentionally short to create side load

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    /**
     * Initial configuration must exceed lateral pressure limits.
     * Engine should automatically attempt longer sling mitigation.
     */

    expect(result.lateralPressure).toBeDefined();
    expect(result.lateralPressure.percent).toBeGreaterThan(10);

    expect(result.mitigation).toBeDefined();
    expect(result.mitigation.type).toBe("longer_slings");

    expect(result.mitigation.options.length).toBeGreaterThan(0);

    const option = result.mitigation.options[0];

    expect(option.slingLengthFt).toBeGreaterThan(8);
    expect(option.lateralPressure.percent).toBeLessThanOrEqual(10);

    expect(result.governingSummary)
      .toContain("Lateral pressure");
  });
});