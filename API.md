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
