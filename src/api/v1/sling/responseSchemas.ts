import { z } from "zod";

/**
 * Sling App API v1 — Response Reason Enum (LOCKED)
 */
export const BlockedReasonEnum = z.enum([
  // Geometry / angle
  "sling_angle_below_minimum",
  "sling_length_exceeds_maximum",

  // Capacity
  "wll_exceeded",
  "top_rigging_wll_exceeded",
  "shackle_wll_exceeded",

  // Geometry / configuration
  "invalid_pick_point_geometry",
  "legs_pick_points_mismatch",

  // Lateral pressure
  "lateral_pressure_exceeded",

  // Hook / headroom (informational validation only)
  "hook_height_exceeded",
  "block_clearance_insufficient",

  // System / validation
  "invalid_request_payload",
  "unsupported_configuration",
]);

export type BlockedReason = z.infer<typeof BlockedReasonEnum>;

/* ----------------------------------
   Valid Lift Result
---------------------------------- */

export const ValidLiftResultSchema = z.object({
  status: z.literal("valid"),
  blocked: z.literal(false),

  summary: z.object({
    governing_condition: z.string(),
    governing_element_id: z.string(),
    why: z.literal("This is what limits the lift."),
  }),

  results: z.object({
    angles: z.array(
      z.object({
        sling_id: z.string(),
        leg: z.number().int().positive(),
        angle_deg_from_horizontal: z.number(),
      })
    ),

    tensions: z.array(
      z.object({
        sling_id: z.string(),
        leg: z.number().int().positive(),
        tension_lbs: z.number(),
        required_wll_lbs: z.number(),
        recommended_wll_lbs: z.number(),
      })
    ),

    weights: z.object({
      load_lbs: z.number(),
      rigging_lbs: z.number(),
      total_lift_lbs: z.number(),
      total_lift_metric_tons: z.number(),
    }),

    hook_height: z.object({
      required_ft: z.number(),
      limit_ft: z.number(),
      within_limit: z.boolean(),
    }),
  }),

  warnings: z.array(z.string()),

  disclaimer: z.literal(
    "Load acceptability and lug integrity are the user’s responsibility."
  ),
});

/* ----------------------------------
   Blocked Lift Result
---------------------------------- */

export const BlockedLiftResultSchema = z.object({
  status: z.literal("invalid"),
  blocked: z.literal(true),

  reason: BlockedReasonEnum,
  details: z.string(),

  disclaimer: z.literal(
    "Load acceptability and lug integrity are the user’s responsibility."
  ),
});

/* ----------------------------------
   Unified Response Type
---------------------------------- */

export const SlingCalculationResponseSchema = z.union([
  ValidLiftResultSchema,
  BlockedLiftResultSchema,
]);

export type SlingCalculationResponse = z.infer<
  typeof SlingCalculationResponseSchema
>;
