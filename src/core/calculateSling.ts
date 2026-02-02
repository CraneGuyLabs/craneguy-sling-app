import { SlingCalculationRequest } from "../validation/slingSchema";

/**
 * Sling App API v1 — Calculation Core
 * ----------------------------------
 * Field-correct sling calculations with safety enforcement.
 * Assumes input has passed Zod validation.
 *
 * BELOW-THE-HOOK ONLY
 * Hook height is informational / validation only and never governs geometry.
 */

/* ----------------------------------
   Types
---------------------------------- */

export type SlingCalculationResult =
  | ValidLiftResult
  | BlockedLiftResult;

type ValidLiftResult = {
  status: "valid";
  blocked: false;
  summary: {
    governing_condition: string;
    governing_element_id: string;
    why: string;
  };
  results: {
    angles: {
      sling_id: string;
      leg: number;
      angle_deg_from_horizontal: number;
    }[];
    tensions: {
      sling_id: string;
      leg: number;
      tension_lbs: number;
      required_wll_lbs: number;
      recommended_wll_lbs: number;
    }[];
    weights: {
      load_lbs: number;
      rigging_lbs: number;
      total_lift_lbs: number;
      total_lift_metric_tons: number;
    };
    hook_height: {
      required_ft: number;
      limit_ft: number;
      within_limit: boolean;
    };
  };
  warnings: string[];
  disclaimer: string;
};

type BlockedLiftResult = {
  status: "invalid";
  blocked: true;
  reason: string;
  details: string;
  disclaimer: string;
};

/* ----------------------------------
   Helpers
---------------------------------- */

const roundUpFt = (value: number) => Math.ceil(value);

const lbsToMetricTons = (lbs: number) =>
  +(lbs / 2204.62).toFixed(2);

const degFromHorizontal = (rise: number, run: number) =>
  (Math.atan2(rise, run) * 180) / Math.PI;

/* ----------------------------------
   Rigging Self-Weight Tables (v1)
---------------------------------- */

const SLING_WEIGHT_LBS_PER_FT: Record<string, number> = {
  wire_rope: 1.5,
  chain: 2.2,
  synthetic: 0.4,
};

const SHACKLE_WEIGHT_LBS = 35;
const TOP_RIGGING_ALLOWANCE_LBS = 50;

/* ----------------------------------
   Constants (v1 Locks)
---------------------------------- */

const MIN_SLING_ANGLE_DEG = 45; // bottom-of-hook connections
const RECOMMENDED_FACTOR = 1.5;

/* ----------------------------------
   Main Calculation
---------------------------------- */

export function calculateSling(
  request: SlingCalculationRequest
): SlingCalculationResult {
  const { load, geometry, slings, hook_interface, hardware } = request;

  const pickPoints = geometry.pick_points;
  const totalLoadLbs = load.weight_lbs;

  let governingAngleDeg = Infinity;
  let governingLegId = "";
  let governingReason = "";

  const angleResults: ValidLiftResult["results"]["angles"] = [];
  const tensionResults: ValidLiftResult["results"]["tensions"] = [];

  /* -----------------------------
     Geometry + Per-Leg Calculations
  ------------------------------*/

  for (const sling of slings) {
    const legs = sling.legs;
    const loadPerLeg = totalLoadLbs / legs;

    pickPoints.forEach((point, index) => {
      const legNumber = index + 1;

      const horizontalRun = Math.sqrt(
        Math.pow(point.x_ft, 2) + Math.pow(point.y_ft, 2)
      );

      const verticalRise = point.z_ft;

      const angleDeg = degFromHorizontal(verticalRise, horizontalRun);
      const roundedAngle = Math.ceil(angleDeg);

      angleResults.push({
        sling_id: sling.id,
        leg: legNumber,
        angle_deg_from_horizontal: roundedAngle,
      });

      if (angleDeg < governingAngleDeg) {
        governingAngleDeg = angleDeg;
        governingLegId = `${sling.id}-leg-${legNumber}`;
        governingReason = "sling_angle";
      }

      if (angleDeg <= MIN_SLING_ANGLE_DEG) {
        return;
      }

      const tension =
        loadPerLeg / Math.sin((angleDeg * Math.PI) / 180);

      tensionResults.push({
        sling_id: sling.id,
        leg: legNumber,
        tension_lbs: Math.ceil(tension),
        required_wll_lbs: Math.ceil(tension),
        recommended_wll_lbs: Math.ceil(tension * RECOMMENDED_FACTOR),
      });
    });
  }

  if (governingAngleDeg <= MIN_SLING_ANGLE_DEG) {
    return {
      status: "invalid",
      blocked: true,
      reason: "sling_angle_below_minimum",
      details: `Minimum sling angle ${governingAngleDeg.toFixed(
        1
      )}° is below ${MIN_SLING_ANGLE_DEG}°`,
      disclaimer:
        "Load acceptability and lug integrity are the user’s responsibility.",
    };
  }

  if (
    tensionResults.some(
      (t) =>
        slings.find((s) => s.id === t.sling_id)!.wll_lbs < t.tension_lbs
    )
  ) {
    return {
      status: "invalid",
      blocked: true,
      reason: "wll_exceeded",
      details: "One or more sling legs exceed WLL",
      disclaimer:
        "Load acceptability and lug integrity are the user’s responsibility.",
    };
  }

  /* -----------------------------
     Rigging Self-Weight
  ------------------------------*/

  let riggingWeightLbs = 0;

  for (const sling of slings) {
    riggingWeightLbs +=
      sling.length_ft *
      SLING_WEIGHT_LBS_PER_FT[sling.type] *
      sling.legs;
  }

  if (hardware?.shackles) {
    riggingWeightLbs +=
      hardware.shackles.length * SHACKLE_WEIGHT_LBS;
  }

  if (hardware?.top_rigging) {
    riggingWeightLbs += TOP_RIGGING_ALLOWANCE_LBS;
  }

  riggingWeightLbs = Math.ceil(riggingWeightLbs);

  /* -----------------------------
     Hook Height (Informational Only)
  ------------------------------*/

  const maxPickZ = Math.max(...pickPoints.map((p) => p.z_ft));

  const requiredHookHeight = roundUpFt(
    maxPickZ + hook_interface.block_clearance_ft
  );

  if (requiredHookHeight > hook_interface.hook_height_limit_ft) {
    return {
      status: "invalid",
      blocked: true,
      reason: "hook_height_exceeded",
      details: `Required hook height exceeds limit by ${
        requiredHookHeight - hook_interface.hook_height_limit_ft
      } ft`,
      disclaimer:
        "Load acceptability and lug integrity are the user’s responsibility.",
    };
  }

  /* -----------------------------
     Final Weights
  ------------------------------*/

  const totalLiftLbs = totalLoadLbs + riggingWeightLbs;

  /* -----------------------------
     Return Valid Lift
  ------------------------------*/

  return {
    status: "valid",
    blocked: false,
    summary: {
      governing_condition: governingReason,
      governing_element_id: governingLegId,
      why: "Minimum allowable sling angle governs the lift",
    },
    results: {
      angles: angleResults,
      tensions: tensionResults,
      weights: {
        load_lbs: totalLoadLbs,
        rigging_lbs: riggingWeightLbs,
        total_lift_lbs: totalLiftLbs,
        total_lift_metric_tons: lbsToMetricTons(totalLiftLbs),
      },
      hook_height: {
        required_ft: requiredHookHeight,
        limit_ft: hook_interface.hook_height_limit_ft,
        within_limit: true,
      },
    },
    warnings: [],
    disclaimer:
      "Load acceptability and lug integrity are the user’s responsibility.",
  };
}
