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

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — shackle connection factor enforcement
 * ---------------------------------------------------------------------
 * These tests verify that:
 * - Shackles are sized using a 1.25× connection factor
 *   when selected from calculated sling tension
 * - No additional multipliers are applied
 */

describe("runRiggingEngine — shackle connection factor enforcement", () => {
  it("applies a single 1.25× connection factor when sizing shackles from sling tension", () => {
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

    const leg = result.legs[0];

    expect(leg.tensionLb).toBeDefined();
    expect(leg.shackle).toBeDefined();

    const expectedRequiredCapacity =
      leg.tensionLb * 1.25;

    expect(leg.shackle.requiredCapacityLb)
      .toBeCloseTo(expectedRequiredCapacity, 1);

    /**
     * Ensure no additional safety factor is applied
     * beyond the single 1.25× connection factor.
     */
    expect(leg.shackle.appliedFactor).toBe(1.25);
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — shackle sizing from sling WLL
 * ---------------------------------------------------------------------
 * These tests verify that when a shackle is selected
 * to match a sling's rated capacity:
 * - NO 1.25× connection factor is applied
 * - Shackle WLL >= sling WLL exactly
 */

describe("runRiggingEngine — shackle sizing from sling WLL", () => {
  it("does NOT apply a 1.25× factor when sizing shackle from sling WLL", () => {
    const result = runRiggingEngine({
      loadWeightLb: 12000,

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

    const leg = result.legs[0];

    expect(leg.sling).toBeDefined();
    expect(leg.shackle).toBeDefined();

    /**
     * Shackle must be selected to match sling WLL,
     * not sling tension.
     */
    expect(leg.shackle.selectionBasis)
      .toBe("sling_wll");

    expect(leg.shackle.requiredCapacityLb)
      .toBe(leg.sling.wllLb);

    /**
     * Explicitly confirm NO connection factor was applied.
     */
    expect(leg.shackle.appliedFactor)
      .toBe(1);
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — sling material preference and sharp-edge override
 * ---------------------------------------------------------------------
 * These tests verify that:
 * - Synthetic slings are preferred by default
 * - Sharp edges override synthetic preference
 * - Wire rope slings are selected when sharp edges are present
 */

describe("runRiggingEngine — sling material preference", () => {
  it("selects synthetic round slings when no sharp edges are present", () => {
    const result = runRiggingEngine({
      loadWeightLb: 6000,

      pickPoints: [
        { x: -4, y: 0, z: 0 },
        { x:  4, y: 0, z: 0 }
      ],

      slingLengthFt: 10,

      configuration: {
        legs: 2,
        hitch: "vertical",
        sharpEdgesPresent: false
      }
    });

    const leg = result.legs[0];

    expect(leg.sling).toBeDefined();
    expect(leg.sling.material).toBe("synthetic_round");
  });

  it("overrides synthetic slings and selects wire rope when sharp edges are present", () => {
    const result = runRiggingEngine({
      loadWeightLb: 6000,

      pickPoints: [
        { x: -4, y: 0, z: 0 },
        { x:  4, y: 0, z: 0 }
      ],

      slingLengthFt: 10,

      configuration: {
        legs: 2,
        hitch: "vertical",
        sharpEdgesPresent: true
      }
    });

    const leg = result.legs[0];

    expect(leg.sling).toBeDefined();

    // Synthetic slings must NOT be selected on sharp edges
    expect(leg.sling.material).not.toBe("synthetic_round");

    // Wire rope slings are preferred on sharp edges
    expect(leg.sling.material).toBe("wire_rope");
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — top rigging minimum angle enforcement
 * ---------------------------------------------------------------------
 * These tests verify that top rigging slings connected above the load
 * or above a spreader bar must meet a ≥60° minimum angle requirement.
 */

describe("runRiggingEngine — top rigging minimum angle enforcement", () => {
  it("blocks a lift when top rigging sling angle is below 60°", () => {
    const badTopRigging = {
      loadWeightLb: 14000,

      // Bottom rigging — VALID
      pickPoints: [
        { x: -5, y: 0, z: 0 },
        { x:  5, y: 0, z: 0 }
      ],

      slingLengthFt: 12,

      configuration: {
        legs: 2,
        hitch: "vertical"
      },

      // Top rigging — intentionally too flat (<60°)
      topRigging: {
        pickPoints: [
          { x: -12, y: 0, z: 0 },
          { x:  12, y: 0, z: 0 }
        ],
        slingLengthFt: 14,
        legs: 2
      }
    };

    /**
     * Bottom rigging is acceptable.
     * Top rigging violates the ≥60° minimum angle rule.
     * The engine must BLOCK the lift.
     */

    expect(() => runRiggingEngine(badTopRigging)).toThrow(
      "Invalid top rigging configuration"
    );
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — offset CG with unequal sling lengths
 * ---------------------------------------------------------------------
 * These tests verify that:
 * - Unequal sling lengths are permitted
 * - Level lift is achieved through geometry, not equal lengths
 * - Governing leg is determined by tension, not sling length
 */

describe("runRiggingEngine — offset CG with unequal sling lengths", () => {
  it("allows unequal sling lengths for a level lift when CG is offset", () => {
    const result = runRiggingEngine({
      loadWeightLb: 10000,

      // Offset CG toward right pick
      pickPoints: [
        { x: -4, y: 0, z: 0 },
        { x:  6, y: 0, z: 0 }
      ],

      // Unequal sling lengths required for level lift
      slingLengthsFt: [11, 9],

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    expect(result.legs).toHaveLength(2);

    const leftLeg  = result.legs[0];
    const rightLeg = result.legs[1];

    // Sling lengths are intentionally unequal
    expect(leftLeg.slingLengthFt)
      .not.toBeCloseTo(rightLeg.slingLengthFt, 2);

    // Lift remains valid
    expect(result.valid).toBe(true);

    // Governing leg determined by tension, not length
    expect(leftLeg.tensionLb !== rightLeg.tensionLb).toBe(true);

    expect(result.governingSummary)
      .toContain("This is what limits the lift");
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — rigging self-weight accounting
 * ---------------------------------------------------------------------
 * These tests verify that the weight of rigging hardware
 * is included in the total crane load calculation.
 */

describe("runRiggingEngine — rigging self-weight accounting", () => {
  it("adds sling and shackle weight to the total lifted load", () => {
    const result = runRiggingEngine({
      loadWeightLb: 10000,

      pickPoints: [
        { x: -5, y: 0, z: 0 },
        { x:  5, y: 0, z: 0 }
      ],

      slingLengthFt: 12,

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    /**
     * Base load is 10,000 lb.
     * Total crane load must be GREATER than base load
     * due to inclusion of rigging weight.
     */

    expect(result.totalLoadLb).toBeDefined();
    expect(result.totalLoadLb).toBeGreaterThan(10000);

    // Explicit confirmation that rigging contributes weight
    expect(result.riggingWeightLb).toBeDefined();
    expect(result.riggingWeightLb).toBeGreaterThan(0);

    expect(result.totalLoadLb)
      .toBeCloseTo(
        10000 + result.riggingWeightLb,
        1
      );

    expect(result.governingSummary)
      .toContain("This is what limits the lift");
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — top hook multi-sling load sharing
 * ---------------------------------------------------------------------
 * These tests verify that multiple top slings may share load at the hook,
 * while each sling is still evaluated independently for geometry, angle,
 * and governing tension.
 */

describe("runRiggingEngine — top hook multi-sling load sharing", () => {
  it("allows load sharing across multiple top slings but enforces per-sling rules", () => {
    const result = runRiggingEngine({
      loadWeightLb: 24000,

      // Bottom rigging — valid and symmetric
      pickPoints: [
        { x: -6, y: 0, z: 0 },
        { x:  6, y: 0, z: 0 }
      ],

      slingLengthFt: 14,

      configuration: {
        legs: 2,
        hitch: "vertical"
      },

      // Top rigging — two slings sharing load at the hook
      topRigging: {
        legs: [
          {
            pickPoints: [
              { x: -4, y: 0, z: 0 },
              { x:  4, y: 0, z: 0 }
            ],
            slingLengthFt: 10
          },
          {
            pickPoints: [
              { x: -5, y: 0, z: 0 },
              { x:  5, y: 0, z: 0 }
            ],
            slingLengthFt: 11
          }
        ]
      }
    });

    expect(result.topRigging).toBeDefined();
    expect(result.topRigging.legs).toHaveLength(2);

    const topLegA = result.topRigging.legs[0];
    const topLegB = result.topRigging.legs[1];

    // Load sharing is allowed
    expect(topLegA.tensionLb).toBeGreaterThan(0);
    expect(topLegB.tensionLb).toBeGreaterThan(0);

    // But tensions are evaluated independently
    expect(topLegA.tensionLb)
      .not.toBeCloseTo(topLegB.tensionLb, 1);

    // Each sling must meet top-rigging angle requirements
    expect(topLegA.angleDeg).toBeGreaterThanOrEqual(60);
    expect(topLegB.angleDeg).toBeGreaterThanOrEqual(60);

    // Governing leg must be explicitly identified
    expect(result.topRigging.governingLegIndex).toBeDefined();

    expect(result.governingSummary)
      .toContain("Top rigging");

    expect(result.governingSummary)
      .toContain("This is what limits the lift");
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — lateral pressure warning vs block classification
 * ---------------------------------------------------------------------
 * These tests verify that lateral pressure is classified correctly:
 * - ≤10% results in a warning only
 * - >10% triggers mitigation or blocking
 */

describe("runRiggingEngine — lateral pressure classification", () => {
  it("issues a warning (not a block) when lateral pressure is ≤10%", () => {
    const result = runRiggingEngine({
      loadWeightLb: 12000,

      pickPoints: [
        { x: -6, y: 0, z: 0 },
        { x:  6, y: 0, z: 0 }
      ],

      slingLengthFt: 14, // long enough to reduce side load

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    expect(result.lateralPressure).toBeDefined();
    expect(result.lateralPressure.percent).toBeGreaterThan(0);
    expect(result.lateralPressure.percent).toBeLessThanOrEqual(10);

    // Lift remains valid
    expect(result.valid).toBe(true);

    // Warning is issued, not a block
    expect(result.warnings).toBeDefined();
    expect(result.warnings.length).toBeGreaterThan(0);

    expect(result.mitigation).toBeUndefined();

    expect(result.governingSummary)
      .toContain("Lateral pressure");
  });
});

/**
 * ---------------------------------------------------------------------
 * runRiggingEngine — hook height informational only
 * ---------------------------------------------------------------------
 * These tests verify that hook height:
 * - Does NOT govern below-the-hook geometry or selection
 * - May generate warnings only
 * - Never alters sling angles, tensions, or hardware sizing
 */

describe("runRiggingEngine — hook height informational only", () => {
  it("does not alter below-the-hook results when hook height is constrained", () => {
    const result = runRiggingEngine({
      loadWeightLb: 12000,

      pickPoints: [
        { x: -5, y: 0, z: 0 },
        { x:  5, y: 0, z: 0 }
      ],

      slingLengthFt: 12,

      configuration: {
        legs: 2,
        hitch: "vertical"
      },

      // Informational crane limits only
      crane: {
        maxHookHeightFt: 15,     // intentionally tight
        blockClearanceFt: 3
      }
    });

    /**
     * Below-the-hook rigging must remain valid.
     * Hook height constraints may only issue warnings.
     */

    expect(result.valid).toBe(true);

    expect(result.legs).toHaveLength(2);
    expect(result.legs[0].tensionLb).toBeGreaterThan(0);
    expect(result.legs[1].tensionLb).toBeGreaterThan(0);

    // Hook height warnings may exist
    expect(result.warnings).toBeDefined();
    expect(
      result.warnings.some(w =>
        w.toLowerCase().includes("hook height") ||
        w.toLowerCase().includes("clearance")
      )
    ).toBe(true);

    // Hook height must NOT appear as a governing condition
    expect(result.governingSummary)
      .not.toContain("Hook height");

    expect(result.governingSummary)
      .toContain("This is what limits the lift");
  });
});