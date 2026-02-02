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
}---

## Governing Logic

All outputs are limited by the **controlling condition**, including but not limited to:
- Sling leg tension
- Sling angle
- Hardware capacity
- Geometry
- Lateral pressure
- Clearance constraints

The governing condition is explicitly identified as:

> **This is what limits the lift.**

---

## Safety Rules (Hard Gates)

The API enforces the following non-bypassable safety rules:

- Invalid sling angles are blocked
- Exceeded sling or hardware WLLs are blocked
- Clearance violations are blocked or warned per configuration
- Practical sling-length cap of **40 ft** is enforced
- Automatic mitigation is attempted when lateral pressure exceeds limits
- If lateral pressure cannot be reduced within limits, a spreader bar or lift beam is required
- Informational outputs never override governing rigging logic

---

## Output Guarantees

When a valid configuration exists, the API guarantees:

- Governing leg and governing condition are always identified
- Minimum required rigging is calculated from actual geometry and tension
- Recommended rigging is sized at **≥ 1.5×** calculated sling tension
- Load-sharing is applied only where explicitly allowed
- Rigging and hardware self-weight are included in total load calculations
- Shackles are selected using **carbon steel shackles only**, with a **6:1 design factor**
- Shackle sizing follows:
  - **WLL ≥ applied load**, or
  - **WLL ≥ sling WLL** when matching hardware to a known sling
- The **1.25× connection factor** is applied **only** when sizing shackles from calculated sling tension

---

## Versioning Rule

- **v1.x**: No breaking changes  
- Any change to:
  - Calculation logic
  - Geometry handling
  - Safety rules
  - Governing-condition logic
  - Payload or response structure  

  → **Requires v2.0**

No exceptions.

---

## Disclaimer

Load acceptability and lug integrity are the user’s responsibility.
