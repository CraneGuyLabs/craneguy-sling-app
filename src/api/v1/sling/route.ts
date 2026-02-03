import { Router } from "express";
import { SlingCalculationRequestSchema } from "../validation/slingSchema";
import { SlingCalculationResponseSchema } from "./responseSchemas";
import { calculateSling } from "./calculateSling";

const router = Router();

/**
 * POST /api/v1/sling/calculate
 * Sling App API v1
 */
router.post("/calculate", (req, res) => {
  // 1. Validate request
  const request = SlingCalculationRequestSchema.parse(req.body);

  // 2. Run calculation
  const result = calculateSling(request);

  // 3. Validate response (safety gate)
  const validatedResponse =
    SlingCalculationResponseSchema.parse(result);

  // 4. Return response
  res.status(200).json(validatedResponse);
});

export default router;
