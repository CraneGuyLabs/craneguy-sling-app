# CraneGuyLabs Sling App

CraneGuyLabs Sling App is a safety-focused engineering tool designed for riggers, lift planners, and crane professionals to validate sling geometry, angles, tensions, hardware selection, and governing conditions before execution.

A professional, below-the-hook rigging calculator with governing-condition validation for real-world field use.

---

## Purpose

Provide calculation-correct sling angles, leg tensions, and governing-condition identification using true lift geometry — not rules of thumb.

---

## Scope

This is a **below-the-hook rigging calculator**.

### Included
- Multi-leg sling configurations  
- Governing-leg determination  
- Minimum required and recommended rigging sizing  
- Hook height and block/headroom clearance checks (informational and validation only)  
- Rigging and hardware weight accounting  

### Out of Scope (unless explicitly stated)
- Crane selection or capacity  
- Crane setup or configuration  
- Lift planning beyond below-the-hook rigging  

All rigging is assumed to occur **at the hook and below**.

---

## Governing Logic

All outputs are limited by the controlling condition — including sling angle, leg tension, hardware capacity, geometry, lateral pressure, or clearance — **whichever governs first**.

The governing condition is explicitly identified as:

> *This is what limits the lift.*

---

## Field Principles

- Geometry is authoritative  
- Load-sharing is allowed where applicable  
- Sling angle is measured from a horizontal reference at the pick point  
- All user-facing distances are rounded **up** to the nearest whole foot  
- Safety gates block invalid or unsafe configurations  
- Informational outputs never override governing rigging logic  

---

## Status

Active development.  
Field-use logic is **frozen** per the Sling App master specification.

---

## Disclaimer

Load acceptability and lug integrity are the user’s responsibility.
