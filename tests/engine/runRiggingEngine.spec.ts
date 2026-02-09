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

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — mitigation cap enforcement
 * ---------------------------------------------------------------------
 * These tests verify that longer-sling mitigation is capped at 40 ft
 * and that a beam is required when lateral pressure cannot be reduced.
 */

describe("runRiggingEngine — mitigation cap enforcement", () => {
  it("requires a beam when lateral pressure cannot be mitigated within 40 ft sling length", () => {
    const result = runRiggingEngine({
      loadWeightLb: 20000,

      pickPoints: [
        { x: -15, y: 0, z: 0 },
        { x:  15, y: 0, z: 0 }
      ],

      slingLengthFt: 10, // very short relative to span

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    /**
     * Geometry is so wide that even maximum sling length
     * cannot reduce lateral pressure to acceptable limits.
     */

    expect(result.lateralPressure).toBeDefined();
    expect(result.lateralPressure.percent).toBeGreaterThan(10);

    expect(result.mitigation).toBeDefined();
    expect(result.mitigation.type).toBe("beam_required");

    expect(result.mitigation.reason)
      .toContain("40 ft");

    expect(result.governingSummary)
      .toContain("Spreader bar");
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — top vs bottom rigging independence
 * ---------------------------------------------------------------------
 * These tests verify that bottom rigging is evaluated independently
 * of top rigging and that top rigging does not mask bottom rigging limits.
 */

describe("runRiggingEngine — top rigging independence", () => {
  it("evaluates top rigging independently without altering bottom rigging results", () => {
    const result = runRiggingEngine({
      loadWeightLb: 18000,

      // Bottom rigging — VALID geometry
      pickPoints: [
        { x: -6, y: 0, z: 0 },
        { x:  6, y: 0, z: 0 }
      ],

      slingLengthFt: 14,

      configuration: {
        legs: 2,
        hitch: "vertical"
      },

      // Top rigging — intentionally flatter / governing
      topRigging: {
        pickPoints: [
          { x: -10, y: 0, z: 0 },
          { x:  10, y: 0, z: 0 }
        ],
        slingLengthFt: 12,
        legs: 2
      }
    });

    /**
     * Bottom rigging must remain valid and unchanged.
     * Top rigging may govern overall configuration.
     */

    expect(result.bottomRigging).toBeDefined();
    expect(result.bottomRigging.valid).toBe(true);

    expect(result.topRigging).toBeDefined();
    expect(result.topRigging.valid).toBe(false);

    expect(result.governingSummary)
      .toContain("Top rigging");

    expect(result.governingSummary)
      .toContain("This is what limits the lift");
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — shackle sizing with connection factor
 * ---------------------------------------------------------------------
 * These tests verify that shackles are sized correctly using:
 * - Calculated sling tension
 * - Single 1.25× connection factor
 * - No additional derating or stacking
 */

describe("runRiggingEngine — shackle sizing", () => {
  it("sizes shackles using calculated tension × 1.25 connection factor", () => {
    const result = runRiggingEngine({
      loadWeightLb: 16000,

      pickPoints: [
        { x: -6, y: 0, z: 0 },
        { x:  6, y: 0, z: 0 }
      ],

      slingLengthFt: 12,

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    expect(result.legs).toHaveLength(2);

    const leg = result.legs[0];

    expect(leg.tensionLb).toBeGreaterThan(0);

    /**
     * Shackle load must be calculated as:
     * shackleLoad = slingTension × 1.25
     */
    expect(leg.shackle).toBeDefined();

    expect(leg.shackle.appliedLoadLb)
      .toBeCloseTo(leg.tensionLb * 1.25, 1);

    /**
     * Selected shackle WLL must meet or exceed applied load.
     */
    expect(leg.shackle.wllLb)
      .toBeGreaterThanOrEqual(leg.shackle.appliedLoadLb);

    /**
     * No additional connection factor may be stacked.
     */
    expect(leg.shackle.connectionFactor).toBe(1.25);
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — shackle material and minimum size enforcement
 * ---------------------------------------------------------------------
 * These tests verify that:
 * - Only carbon steel shackles are used
 * - Minimum shackle size is enforced (0.5-ton)
 * - No alloy shackles are ever selected
 */

describe("runRiggingEngine — shackle material and minimum size enforcement", () => {
  it("enforces minimum 0.5-ton carbon steel shackle regardless of low tension", () => {
    const result = runRiggingEngine({
      loadWeightLb: 2000, // intentionally light load

      pickPoints: [
        { x: -2, y: 0, z: 0 },
        { x:  2, y: 0, z: 0 }
      ],

      slingLengthFt: 8,

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    expect(result.legs).toHaveLength(2);

    const leg = result.legs[0];

    expect(leg.shackle).toBeDefined();

    // Minimum shackle size rule
    expect(leg.shackle.nominalSize)
      .toBeGreaterThanOrEqual(0.5);

    // Carbon steel only
    expect(leg.shackle.material).toBe("carbon_steel");

    // Alloy shackles must never appear
    expect(leg.shackle.material).not.toBe("alloy");
  });
});