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
      { id: "A", x_ft: 0, y_ft: 0, z_ft: 6 },
      { id: "B", x_ft: 10, y_ft: 0, z_ft: 6 },
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
  crane_interface: {
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

describe("calculateSling — v1", () => {
  it("returns a valid lift for a compliant configuration", () => {
    const result = calculateSling(baseRequest);

    expect(result.status).toBe("valid");
    expect(result.blocked).toBe(false);

    if (result.status === "valid") {
      expect(result.results.angles[0].angle_deg_from_horizontal).toBeGreaterThanOrEqual(60);
      expect(result.results.tensions[0].tension_lbs).toBeGreaterThan(0);
      expect(result.results.hook_height.within_limit).toBe(true);
    }
  });

  it("blocks the lift when sling angle is below 60°", () => {
    const badAngleRequest: SlingCalculationRequest = {
      ...baseRequest,
      geometry: {
        ...baseRequest.geometry,
        pick_points: [
          { id: "A", x_ft: 0, y_ft: 0, z_ft: 1 },
          { id: "B", x_ft: 30, y_ft: 0, z_ft: 1 },
        ],
      },
    };

    const result = calculateSling(badAngleRequest);

    expect(result.status).toBe("invalid");
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("sling_angle_below_minimum");
  });

  it("blocks the lift when sling WLL is insufficient", () => {
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

  it("blocks the lift when required hook height exceeds crane limit", () => {
    const badHookHeightRequest: SlingCalculationRequest = {
      ...baseRequest,
      geometry: {
        ...baseRequest.geometry,
        pick_points: [
          { id: "A", x_ft: 0, y_ft: 0, z_ft: 40 },
          { id: "B", x_ft: 10, y_ft: 0, z_ft: 40 },
        ],
      },
      crane_interface: {
        hook_height_limit_ft: 30,
        block_clearance_ft: 6,
      },
    };

    const result = calculateSling(badHookHeightRequest);

    expect(result.status).toBe("invalid");
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("hook_height_exceeded");
  });

  it("always returns the required disclaimer text", () => {
    const result = calculateSling(baseRequest);

    expect(result.disclaimer).toBe(
      "Load acceptability and lug integrity are the user’s responsibility."
    );
  });
});
