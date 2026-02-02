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
