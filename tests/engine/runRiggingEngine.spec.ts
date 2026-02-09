import { runRiggingEngine } from "../../src/engine";

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