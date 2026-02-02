import { z } from "zod";

/**
 * Sling App API v1 — Input Validation Schema
 * -----------------------------------------
 * This schema is the single source of truth for what
 * constitutes a VALID request to /api/v1/sling/calculate.
 *
 * If data fails here, calculations MUST NOT run.
 */

/* -----------------------------
   Pick Point Geometry
------------------------------*/
const PickPointSchema = z.object({
  id: z.string().min(1, "Pick point ID is required"),
  x_ft: z.number().finite(),
  y_ft: z.number().finite(),
  // Z is measured from TOP of load to pick-point centerline (≥ 0 allowed)
  z_ft: z.number().nonnegative("Pick point Z must be ≥ 0"),
});

/* -----------------------------
   Load Definition
------------------------------*/
const LoadSchema = z.object({
  weight_lbs: z.number().positive("Load weight must be greater than zero"),
  cg_known: z.boolean(),
});

/* -----------------------------
   Sling Definition
------------------------------*/
const SlingSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["wire_rope", "chain", "synthetic"]),
  legs: z.number().int().positive(),
  length_ft: z
    .number()
    .positive("Sling length must be greater than zero")
    .max(40, "Maximum allowed sling length is 40 ft"),
  wll_lbs: z.number().positive("Sling WLL must be greater than zero"),
  sharing_allowed: z.boolean(),
});

/* -----------------------------
   Hardware
------------------------------*/
const ShackleSchema = z.object({
  id: z.string().min(1),
  wll_lbs: z.number().positive("Shackle WLL must be greater than zero"),
});

const TopRiggingSchema = z.object({
  slings: z.number().int().positive("Top rigging must include at least one sling"),
  sharing_allowed: z.boolean(),
});

/* -----------------------------
   Hook Interface (Below-the-Hook Only)
------------------------------*/
const HookInterfaceSchema = z.object({
  hook_height_limit_ft: z.number().positive(),
  block_clearance_ft: z.number().positive(),
});

/* -----------------------------
   Options (v1 Locked)
------------------------------*/
const OptionsSchema = z.object({
  auto_sling_length: z.boolean(),
  round_distances_up: z.literal(true),
});

/* -----------------------------
   Main Request Schema
------------------------------*/
export const SlingCalculationRequestSchema = z
  .object({
    units: z.literal("imperial"),

    load: LoadSchema,

    geometry: z.object({
      pick_points: z
        .array(PickPointSchema)
        .min(1, "At least one pick point is required"),
      distances_authoritative: z.literal(true),
    }),

    slings: z
      .array(SlingSchema)
      .min(1, "At least one sling configuration is required"),

    hardware: z.object({
      shackles: z.array(ShackleSchema).optional(),
      top_rigging: TopRiggingSchema.optional(),
    }),

    hook_interface: HookInterfaceSchema,

    options: OptionsSchema,
  })
  .superRefine((data, ctx) => {
    data.slings.forEach((sling, slingIndex) => {
      if (data.geometry.pick_points.length !== sling.legs) {
        ctx.addIssue({
          path: ["slings", slingIndex, "legs"],
          code: z.ZodIssueCode.custom,
          message: `Sling "${sling.id}" has ${sling.legs} legs but ${data.geometry.pick_points.length} pick points were provided`,
        });
      }
    });
  });

/* -----------------------------
   Exported Type (for calculations)
------------------------------*/
export type SlingCalculationRequest = z.infer<
  typeof SlingCalculationRequestSchema
>;
