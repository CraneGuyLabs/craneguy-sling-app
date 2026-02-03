import {
  SlingCalculationResponse,
  SlingCalculationResponseSchema,
} from "./responseSchemas";
import { SlingCalculationRequest } from "../validation/slingSchema";

/**
 * Sling App API v1 — Calculation Core
 * ----------------------------------
 * BELOW-THE-HOOK ONLY
 * Hook height is informational / validation only.
 */

const lbsToMetricTons = (lbs: number) =>
  +(lbs / 2204.62).toFixed(2);

const degFromHorizontal = (rise: number, run: number) =>
  (Math.atan2(rise, run) * 180) / Math.PI;

const MIN_SLING_ANGLE_DEG = 45;
const RECOMMENDED_FACTOR = 1.5;

const SLING_WEIGHT_LBS_PER_FT: Record<string, number> = {
  wire_rope: 1.5,
  chain: 2.2,
  synthetic: 0.4,
};

const SHACKLE_WEIGHT_LBS = 35;
const TOP_RIGGING_ALLOWANCE_LBS = 50;

export function calculateSling(
  request: SlingCalculationRequest
): SlingCalculationResult {
  const { load, geometry, slings, hook_interface, hardware } = request;

  const pickPoints = geometry.pick_points;
  const totalLoadLbs = load.weight_lbs;

  let governingAngle = Infinity;
  let governingLegId = "";

  const angleResults: ValidLiftResult["results"]["angles"] = [];
  const tensionResults: ValidLiftResult["results"]["tensions"] = [];

  for (const sling of slings) {
    const loadPerLeg = totalLoadLbs / sling.legs;

    pickPoints.forEach((p, index) => {
      const run = Math.sqrt(p.x_ft ** 2 + p.y_ft ** 2);
      const rise = p.z_ft;

      const angleDeg = degFromHorizontal(rise, run);

      angleResults.push({
        sling_id: sling.id,
        leg: index + 1,
        angle_deg_from_horizontal: Math.round(angleDeg),
      });

      if (angleDeg < governingAngle) {
        governingAngle = angleDeg;
        governingLegId = `${sling.id}-leg-${index + 1}`;
      }

      if (angleDeg <= MIN_SLING_ANGLE_DEG) return;

      const tension =
        loadPerLeg / Math.sin((angleDeg * Math.PI) / 180);

      if (tension > sling.wll_lbs) {
        return;
      }

      tensionResults.push({
        sling_id: sling.id,
        leg: index + 1,
        tension_lbs: Math.ceil(tension),
        required_wll_lbs: Math.ceil(tension),
        recommended_wll_lbs: Math.ceil(tension * RECOMMENDED_FACTOR),
      });
    });
  }

  if (governingAngle <= MIN_SLING_ANGLE_DEG) {
    return {
      status: "invalid",
      blocked: true,
      reason: "sling_angle_below_minimum",
      details: `Minimum sling angle ${governingAngle.toFixed(
        1
      )}° is below ${MIN_SLING_ANGLE_DEG}°`,
      disclaimer:
        "Load acceptability and lug integrity are the user’s responsibility.",
    };
  }

  if (
    tensionResults.length === 0 ||
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

  let riggingWeight = 0;

  for (const sling of slings) {
    riggingWeight +=
      sling.length_ft *
      SLING_WEIGHT_LBS_PER_FT[sling.type] *
      sling.legs;
  }

  if (hardware?.shackles)
    riggingWeight += hardware.shackles.length * SHACKLE_WEIGHT_LBS;

  if (hardware?.top_rigging)
    riggingWeight += TOP_RIGGING_ALLOWANCE_LBS;

  const maxPickZ = Math.max(...pickPoints.map((p) => p.z_ft));
  const requiredHookHeight =
    Math.ceil(maxPickZ + hook_interface.block_clearance_ft);

  if (requiredHookHeight > hook_interface.hook_height_limit_ft) {
    return {
      status: "invalid",
      blocked: true,
      reason: "hook_height_exceeded",
      details: "Required hook height exceeds limit",
      disclaimer:
        "Load acceptability and lug integrity are the user’s responsibility.",
    };
  }

  const totalLift = totalLoadLbs + Math.ceil(riggingWeight);

  return {
    status: "valid",
    blocked: false,
    summary: {
      governing_condition: "sling_angle",
      governing_element_id: governingLegId,
      why: "This is what limits the lift.",
    },
    results: {
      angles: angleResults,
      tensions: tensionResults,
      weights: {
        load_lbs: totalLoadLbs,
        rigging_lbs: Math.ceil(riggingWeight),
        total_lift_lbs: totalLift,
        total_lift_metric_tons: lbsToMetricTons(totalLift),
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
