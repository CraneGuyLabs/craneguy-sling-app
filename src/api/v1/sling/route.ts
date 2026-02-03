import { SlingCalculationRequestSchema } from "../validation/slingSchema";
import { SlingCalculationResponseSchema } from "./responseSchemas";
import { calculateSling } from "./calculateSling";

import type { Request, Response } from "express";

/**
 * POST /api/v1/sling/calculate
 * Sling App API v1 — Route Handler
 */
export function slingCalculateHandler(req: Request, res: Response) {
  // 1. Validate request
  const request = SlingCalculationRequestSchema.parse(req.body);

  // 2. Run calculation
  const result = calculateSling(request);

  // 3. Validate response (safety gate)
  const validatedResponse =
    SlingCalculationResponseSchema.parse(result);

  // 4. Return result
  return res.status(200).json(validatedResponse);
}
