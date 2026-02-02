import { describe, it, expect } from "vitest";
import { calculateSling } from "./calculateSling";
import { SlingCalculationRequest } from "../validation/slingSchema";

/* ----------------------------------
   Base Valid Request (Fixture)
---------------------------------- */

const baseRequest: SlingCalculationRequest = {
  units: "imperial",
  load: {
    weight_lbs: 20000,
    cg_known: true,
  },
  geometry: {
    pick_points: [
      { id: "A", x_ft: 5, y_ft: 0, z_ft: 6 },
      { id: "B", x_ft: -5, y_ft: 0, z_ft: 6 },
    ],
    distances_authoritative: true,
  },
  slings: [
    {
      id: "S1",
      type: "wire_rope",
      legs: 2,
      length_ft: 20,
      wll_lbs: 30000,
      sharing_allowed: true,
    },
  ],
  hardware: {
    shackles: [{ id: "SH1", wll_lbs: 17000 }],
    top_rigging: {
      slings: 2,
      sharing_allowed: true,
    },
  },
  hook_interface: {
    hook_height_limit_ft: 50,
    block_clearance_ft: 6,
  },
  options: {
    auto_sling_length: false,
    round_distances_up: true,
  },
};

/* ----------------------------------
   Tests
---------------------------------- */

describe("calculateSling — v1 (per-leg logic)", () => {
  it("returns a valid lift and evaluates each leg independently", () => {
    const result = calculateSling(baseRequest);

    expect(result.status).toBe("valid");
    expect(result.blocked).toBe(false);

    if (result.status === "valid") {
      expect(result.results.angles.length).toBe(2);
      expect(result.results.tensions.length).toBe(2);

      result.results.angles.forEach((a) => {
        expect(a.angle_deg_from_horizontal).toBeGreaterThanOrEqual(45);
      });

      result.results.tensions.forEach((t) => {
        expect(t.tension_lbs).toBeGreaterThan(0);
        expect(t.recommended_wll_lbs).toBeGreaterThan(
          t.required_wll_lbs
        );
      });
    }
  });

  it("correctly identifies the governing leg by minimum angle", () => {
    const asymmetricRequest: SlingCalculationRequest = {
      ...baseRequest,
      geometry: {
        ...baseRequest.geometry,
        pick_points: [
          { id: "A", x_ft: 12, y_ft: 0, z_ft: 6 }, // worse angle
          { id: "B", x_ft: 3, y_ft: 0, z_ft: 6 },  // better angle
        ],
      },
    };

    const result = calculateSling(asymmetricRequest);

    expect(result.status).toBe("valid");

    if (result.status === "valid") {
      expect(result.summary.governing_element_id).toBe("S1-leg-1");
      expect(result.summary.governing_condition).toBe("sling_angle");
    }
  });

  it("blocks the lift if ANY leg angle is below 45°", () => {
    const badAngleRequest: SlingCalculationRequest = {
      ...baseRequest,
      geometry: {
        ...baseRequest.geometry,
        pick_points: [
          { id: "A", x_ft: 30, y_ft: 0, z_ft: 1 }, // bad leg
          { id: "B", x_ft: 3, y_ft: 0, z_ft: 6 },
        ],
      },
    };

    const result = calculateSling(badAngleRequest);

    expect(result.status).toBe("invalid");
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("sling_angle_below_minimum");
  });

  it("blocks the lift if ANY leg exceeds sling WLL", () => {
    const lowWllRequest: SlingCalculationRequest = {
      ...baseRequest,
      slings: [
        {
          ...baseRequest.slings[0],
          wll_lbs: 5000,
        },
      ],
    };

    const result = calculateSling(lowWllRequest);

    expect(result.status).toBe("invalid");
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("wll_exceeded");
  });

  it("blocks the lift when required hook height exceeds limit", () => {
    const badHookHeightRequest: SlingCalculationRequest = {
      ...baseRequest,
      geometry: {
        ...baseRequest.geometry,
        pick_points: [
          { id: "A", x_ft: 5, y_ft: 0, z_ft: 40 },
          { id: "B", x_ft: -5, y_ft: 0, z_ft: 40 },
        ],
      },
      hook_interface: {
        hook_height_limit_ft: 30,
        block_clearance_ft: 6,
      },
    };

    const result = calculateSling(badHookHeightRequest);

    expect(result.status).toBe("invalid");
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("hook_height_exceeded");
  });

  it("includes rigging self-weight in total lift calculation", () => {
    const result = calculateSling(baseRequest);

    if (result.status === "valid") {
      expect(result.results.weights.rigging_lbs).toBeGreaterThan(0);
      expect(result.results.weights.total_lift_lbs).toBe(
        result.results.weights.load_lbs +
          result.results.weights.rigging_lbs
      );
    }
  });

  it("always returns the required disclaimer text", () => {
    const result = calculateSling(baseRequest);

    expect(result.disclaimer).toBe(
      "Load acceptability and lug integrity are the user’s responsibility."
    );
  });
});
