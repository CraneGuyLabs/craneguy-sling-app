# CraneGuyLabs Sling App

CraneGuyLabs Sling App is a professional, safety-focused rigging calculator designed for riggers, lift planners, and crane professionals to validate sling geometry, angles, leg tensions, hardware selection, and governing conditions before execution.

This application provides calculation assistance only and does not replace professional judgment, engineering oversight, or site-specific safety procedures.

---

## Purpose

Provide calculation-correct sling angles, leg tensions, and governing-condition identification using true lift geometry — not rules of thumb.

---

## Scope

CraneGuyLabs Sling App is a **below-the-hook rigging calculator**.

### Included
- Multi-leg sling configurations  
- Governing-leg determination  
- Geometry-based sling angle calculation  
- Automatic leg tension calculation per sling  
- Minimum required and recommended rigging sizing  
- Rigging and hardware weight accounting  
- Lateral pressure evaluation with automatic mitigation  
- Hook height and block/headroom clearance checks (informational and validation only)  

### Out of Scope (unless explicitly stated)
- Crane selection or crane capacity  
- Crane setup, placement, or configuration  
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

## Safety & Disclosure

If you discover a security vulnerability, calculation error, or logic flaw that could affect rigging safety or load-handling decisions, report it responsibly.

**Email:** security@craneguy.app

Do not open public issues for safety-critical findings.

---

## Status

Active development.  
Field-use logic is **frozen** per the Sling App master specification.

---

## Disclaimer

This application provides calculation assistance only and does not replace professional judgment, engineering oversight, or site-specific safety procedures.

Load acceptability and lug integrity are the user’s responsibility.
