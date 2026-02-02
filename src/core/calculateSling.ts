import { SlingCalculationRequest } from "../validation/slingSchema";

/**
 * Sling App API v1 — Calculation Core
 * ----------------------------------
 * Field-correct sling calculations with safety enforcement.
 * Assumes input has passed Zod validation.
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

/**
 * Conservative average weights per foot (lbs/ft)
 * These are industry-safe placeholders until
 * manufacturer-specific tables are introduced.
 */
const SLING_WEIGHT_LBS_PER_FT: Record<string, number> = {
  wire_rope: 1.5,
  chain: 2.2,
  synthetic: 0.4,
};

const SHACKLE_WEIGHT_LBS = 35; // average large shackle
const TOP_RIGGING_ALLOWANCE_LBS = 50; // master link / rings

/* ----------------------------------
   Main Calculation
---------------------------------- */

export function calculateSling(
  request: SlingCalculationRequest
): SlingCalculationResult {
  const { load, geometry, slings, crane_interface, hardware } = request;

  const pickPoints = geometry.pick_points;
  const totalLoadLbs = load.weight_lbs;

  let governingAngle = Infinity;
  let governingAngleId = "";

  const angleResults: ValidLiftResult["results"]["angles"] = [];
  const tensionResults: ValidLiftResult["results"]["tensions"] = [];

  /* -----------------------------
     Geometry + Sling Calculations
  ------------------------------*/

  for (const sling of slings) {
    const horizontalSpan =
      Math.abs(pickPoints[1].x_ft - pickPoints[0].x_ft);

    const verticalRise = pickPoints[0].z_ft;

    const angleDeg = degFromHorizontal(verticalRise, horizontalSpan / 2);
    const roundedAngle = roundUpFt(angleDeg);

    angleResults.push({
      sling_id: sling.id,
      leg: 1,
      angle_deg_from_horizontal: roundedAngle,
    });

    if (angleDeg < governingAngle) {
      governingAngle = angleDeg;
      governingAngleId = `${sling.id}-leg-1`;
    }

    if (angleDeg < 60) {
      return {
        status: "invalid",
        blocked: true,
        reason: "sling_angle_below_minimum",
        details: `Sling angle ${angleDeg.toFixed(
          1
        )}° is below 60° minimum`,
        disclaimer:
          "Load acceptability and lug integrity are the user’s responsibility.",
      };
    }

    const tension =
      totalLoadLbs / (2 * Math.sin((angleDeg * Math.PI) / 180));

    tensionResults.push({
      sling_id: sling.id,
      leg: 1,
      tension_lbs: Math.ceil(tension),
      required_wll_lbs: Math.ceil(tension),
      recommended_wll_lbs: Math.ceil(tension * 1.5),
    });

    if (sling.wll_lbs < tension) {
      return {
        status: "invalid",
        blocked: true,
        reason: "wll_exceeded",
        details: `Sling ${sling.id} WLL is insufficient`,
        disclaimer:
          "Load acceptability and lug integrity are the user’s responsibility.",
      };
    }
  }

  /* -----------------------------
     Rigging Self-Weight Calculation
  ------------------------------*/

  let riggingWeightLbs = 0;

  // Sling self-weight
  for (const sling of slings) {
    const weightPerFt = SLING_WEIGHT_LBS_PER_FT[sling.type];
    riggingWeightLbs += sling.length_ft * weightPerFt * sling.legs;
  }

  // Shackles
  if (hardware?.shackles) {
    riggingWeightLbs += hardware.shackles.length * SHACKLE_WEIGHT_LBS;
  }

  // Top rigging allowance
  if (hardware?.top_rigging) {
    riggingWeightLbs += TOP_RIGGING_ALLOWANCE_LBS;
  }

  riggingWeightLbs = Math.ceil(riggingWeightLbs);

  /* -----------------------------
     Hook Height Check
  ------------------------------*/

  const requiredHookHeight = roundUpFt(
    pickPoints[0].z_ft + crane_interface.block_clearance_ft
  );

  if (requiredHookHeight > crane_interface.hook_height_limit_ft) {
    return {
      status: "invalid",
      blocked: true,
      reason: "hook_height_exceeded",
      details: `Required hook height exceeds crane limit by ${
        requiredHookHeight - crane_interface.hook_height_limit_ft
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
      governing_condition: "sling_angle",
      governing_element_id: governingAngleId,
      why: "Minimum allowable sling angle reached first",
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
        limit_ft: crane_interface.hook_height_limit_ft,
        within_limit: true,
      },
    },
    warnings: [],
    disclaimer:
      "Load acceptability and lug integrity are the user’s responsibility.",
  };
}
