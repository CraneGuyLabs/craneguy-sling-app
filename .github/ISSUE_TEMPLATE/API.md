# Sling App API — v1.0 (Frozen Contract)

## Status
This API contract is **frozen**. Any logic or structural change requires a new version.

---

## Design Principles
- Geometry is authoritative
- Governing condition is always identified
- Safety gates block invalid lifts
- All calculations are field-correct
- User-facing distances are rounded **UP** to the nearest whole foot
- All weights are reported in pounds first, metric tons second

---

## Base URL
/api/v1

## Format
- Request: application/json
- Response: application/json

---

## Endpoint

### POST /sling/calculate

Primary calculation endpoint for all sling and rigging evaluations.

---

## Request Payload

```json
{
  "units": "imperial",
  "load": {
    "weight_lbs": 20000,
    "cg_known": true
  },
  "geometry": {
    "pick_points": [
      { "id": "A", "x_ft": 0, "y_ft": 0, "z_ft": 1.5 },
      { "id": "B", "x_ft": 10, "y_ft": 0, "z_ft": 1.5 }
    ],
    "distances_authoritative": true
  },
  "slings": [
    {
      "id": "S1",
      "type": "wire_rope",
      "legs": 2,
      "length_ft": 20,
      "wll_lbs": 26000,
      "sharing_allowed": true
    }
  ],
  "hardware": {
    "shackles": [
      { "id": "SH1", "wll_lbs": 17000 }
    ],
    "top_rigging": {
      "slings": 2,
      "sharing_allowed": true
    }
  },
  "crane_interface": {
    "hook_height_limit_ft": 85,
    "block_clearance_ft": 6
  },
  "options": {
    "auto_sling_length": false,
    "round_distances_up": true
  }
}
{
  "status": "valid",
  "blocked": false,
  "summary": {
    "governing_condition": "sling_angle",
    "governing_element_id": "S1-leg-2",
    "why": "Minimum allowable sling angle reached first"
  },
  "results": {
    "angles": [
      { "sling_id": "S1", "leg": 1, "angle_deg_from_horizontal": 62 }
    ],
    "tensions": [
      {
        "sling_id": "S1",
        "leg": 1,
        "tension_lbs": 18450,
        "required_wll_lbs": 18450,
        "recommended_wll_lbs": 27675
      }
    ],
    "weights": {
      "load_lbs": 20000,
      "rigging_lbs": 420,
      "total_lift_lbs": 20420,
      "total_lift_metric_tons": 9.26
    },
    "hook_height": {
      "required_ft": 78,
      "limit_ft": 85,
      "within_limit": true
    }
  },
  "warnings": [
    "Sling angle approaching minimum recommended threshold"
  ],
  "disclaimer": "Load acceptability and lug integrity are the user’s responsibility."
}
{
  "status": "invalid",
  "blocked": true,
  "reason": "hook_height_exceeded",
  "details": "Required hook height exceeds crane limit by 4 ft",
  "disclaimer": "Load acceptability and lug integrity are the user’s responsibility."
}
