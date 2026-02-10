import { runRiggingEngine } from "../src/engine";

/**
 * ---------------------------------------------------------------------
 * governingSummary — snapshot tests
 * ---------------------------------------------------------------------
 * These tests freeze the exact wording of governing summaries.
 * They protect safety language, tone, and authority from drift.
 */

describe("governingSummary snapshot tests", () => {
  it("baseline symmetric lift governing summary", () => {
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

    expect(result.governingSummary).toMatchSnapshot();
  });

  it("governing summary when lateral pressure drives mitigation", () => {
    const result = runRiggingEngine({
      loadWeightLb: 15000,

      pickPoints: [
        { x: -8, y: 0, z: 0 },
        { x:  8, y: 0, z: 0 }
      ],

      slingLengthFt: 8,

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    expect(result.governingSummary).toMatchSnapshot();
  });

  it("governing summary when spreader bar is required", () => {
    const result = runRiggingEngine({
      loadWeightLb: 20000,

      pickPoints: [
        { x: -15, y: 0, z: 0 },
        { x:  15, y: 0, z: 0 }
      ],

      slingLengthFt: 10,

      configuration: {
        legs: 2,
        hitch: "vertical"
      }
    });

    expect(result.governingSummary).toMatchSnapshot();
  });

  it("governing summary when top rigging governs", () => {
    const result = runRiggingEngine({
      loadWeightLb: 18000,

      pickPoints: [
        { x: -6, y: 0, z: 0 },
        { x:  6, y: 0, z: 0 }
      ],

      slingLengthFt: 14,

      configuration: {
        legs: 2,
        hitch: "vertical"
      },

      topRigging: {
        pickPoints: [
          { x: -10, y: 0, z: 0 },
          { x:  10, y: 0, z: 0 }
        ],
        slingLengthFt: 12,
        legs: 2
      }
    });

    expect(result.governingSummary).toMatchSnapshot();
  });
});