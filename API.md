# Sling App API — v1.0 (Frozen Contract)

## Status
This API contract is **FROZEN**.  
Any logic, naming, payload, or structural change **REQUIRES v2.0**.

No exceptions.

---

## Scope Clarification (Authoritative)

This API evaluates **BELOW-THE-HOOK rigging only**.

Included:
- Sling geometry
- Sling angles
- Sling tensions
- Rigging and hardware weights
- Governing condition identification

Explicitly OUT OF SCOPE:
- Crane selection
- Crane capacity
- Crane setup
- Crane operation

Hook height and block/headroom values are accepted **ONLY for informational validation**  
and **DO NOT govern sling geometry or selection**.

---

## Design Principles (Locked)

- Geometry is authoritative
- Governing condition is always identified
- Safety gates block invalid configurations
- Calculations are field-correct
- User-facing distances are rounded **UP** to the nearest whole foot
- All weights are reported **pounds first**, **metric tons second**

---

## Base URL

/api/v1

---

## Format
- Request: `application/json`
- Response: `application/json`

---

## Endpoint

### POST /sling/calculate

Primary calculation endpoint for all sling and rigging evaluations.

---

## Request Payload
```json
{
 ...
}
---

## ValidLiftResult

Returned when a valid, non-blocked configuration exists.

```json
{
  "status": "valid",
  "blocked": false,
  "summary": {
    "governing_condition": "sling_angle",
    "governing_element_id": "S1-leg-1",
    "why": "This is what limits the lift."
  },
  "results": {
    "angles": [
      {
        "sling_id": "S1",
        "leg": 1,
        "angle_deg_from_horizontal": 52
      }
    ],
    "tensions": [
      {
        "sling_id": "S1",
        "leg": 1,
        "tension_lbs": 12450,
        "required_wll_lbs": 12450,
        "recommended_wll_lbs": 18675
      }
    ],
    "weights": {
      "load_lbs": 20000,
      "rigging_lbs": 850,
      "total_lift_lbs": 20850,
      "total_lift_metric_tons": 9.46
    },
    "hook_height": {
      "required_ft": 38,
      "limit_ft": 50,
      "within_limit": true
    }
  },
  "warnings": [],
  "disclaimer": "Load acceptability and lug integrity are the user’s responsibility."
}
