# Sling App API — v1.0 (Frozen Contract)

## Status
This API contract is **frozen**.  
Any logic, naming, or structural change requires a new major version.

---

## Scope Clarification
This API evaluates **below-the-hook rigging only**.

All rigging is assumed to occur **at the hook and below**.  
Crane selection, crane capacity, crane setup, and crane operation are **out of scope**.

Hook height and block/headroom values are accepted **for informational and validation purposes only** and do not govern sling geometry or selection.

---

## Design Principles
- Geometry is authoritative
- Governing condition is always identified
- Safety gates block invalid configurations
- All calculations are field-correct
- User-facing distances are rounded **UP** to the nearest whole foot
- All weights are reported in **pounds first**, **metric tons second**

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
  "hook_interface": {
    "hook_height_limit_ft": 85,
    "block_clearance_ft": 6
  },
  "options": {
    "auto_sling_length": false,
    "round_distances_up": true
  }
}
