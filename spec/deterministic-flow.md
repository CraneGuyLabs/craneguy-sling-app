# Sling App — Deterministic Evaluation Flow  
VERSION: 2.15  
STATUS: FIELD-USE LOCKED  

---

## FLOW 0 — Scope Confirmation

This application evaluates **below-the-hook rigging only**.

All crane-related responsibilities, including crane selection, setup, operation, ground conditions, weather, signaling, personnel qualifications, and lift execution, remain solely the responsibility of the user.

The Sling App evaluates:
- Rigging geometry
- Applied forces
- Sling material suitability
- Hardware sizing
- Rigging weight accumulation

---

## FLOW 1 — Configuration Setup

The user defines:
- Number of cranes involved
- Number of pick points on the load
- Use of spreader bars or lift beams

Shared load features such as common lugs or shared load-side shackles must be explicitly declared.

---

## FLOW 1A — Multi-Crane Isolation Gate

Each crane is evaluated in a fully isolated calculation environment.

Geometry, sling selection, angles, tensions, material choices, and hardware sizing **do not transfer between cranes**.

Only the distribution of the load itself may reference other cranes.

---

## FLOW 2 — Load Allocation & Distribution

The applied load is distributed based on:
- Center of gravity
- Declared shared lugs

At this stage:
- Only applied load is allocated
- Rigging weight, hardware weight, and bar or beam weight are excluded

---

## FLOW 3 — Geometry Input

The user inputs:
- Longitudinal distance (L)
- Transverse distance (T)
- Vertical pick depth (V)

Vertical pick depth is always measured from the **top of the load** down to the **centerline of the pick point**.

If direct pick-to-pick distances are entered, those values override derived load dimensions.

---

## FLOW 4 — Geometry Resolution

For each sling leg, the app resolves effective geometry using provided inputs.

Sling length is automatically derived unless the user applies a manual override.

Hidden geometry adjustments for shackles, lugs, and hardware stack-up are applied automatically and transparently.

---

## FLOW 5 — Sling Definition & Material Selection

Each sling leg is defined individually and classified as:
- Bottom rigging, or
- Top rigging

Effective sling length is calculated bearing-to-bearing, including all hardware adjustments.

---

## FLOW 5A — Edge Condition Declaration

The user must declare whether sharp edges are present.

The app never assumes edge protection exists unless explicitly provided by the user.

---

## FLOW 5B — Material Selection Preference

Default material preference:
1. Synthetic round slings  
2. Wire rope slings  
3. Chain slings  

When sharp edges are declared:
- Wire rope slings are preferred
- Chain slings are secondary
- Synthetic slings require explicit user acceptance with warning acknowledgment

---

## FLOW 5C — Terminology Normalization

The term **“steel chokers”** is accepted as field terminology referring to **wire rope slings**.

This term does not indicate hitch type and does not restrict sling configuration.

---

## FLOW 6 — Sling Angle Calculation

Sling angle is measured at the pick point relative to a **horizontal reference line** parallel to the pick-to-pick direction.

Each sling leg is evaluated independently.

---

## FLOW 6A — Rigging Zone Classification

Sling legs are classified based on connection point:
- Bottom-of-hook or bottom-of-bar
- Top-of-bar or top-of-beam

This classification governs minimum allowable sling angles.

---

## FLOW 7 — Angle Safety Gates

- Bottom-of-hook or bottom-of-bar slings must exceed **45° from horizontal**
- Top-of-bar or top-of-beam slings must be **≥ 60° from horizontal**

Any violation blocks the lift configuration.

---

## FLOW 8 — Sling Tension Calculation

Sling tension is calculated individually for each sling leg using resolved geometry and assigned load.

The governing sling is identified for informational purposes only.

---

## FLOW 9 — Lateral Force Evaluation

Lateral force is evaluated as a percentage of the total applied load.

- ≤ 10%: Cautionary warning
- > 10%: Automatic mitigation required

---

## FLOW 10 — Automatic Mitigation Loop

The app automatically evaluates longer sling options up to a **maximum practical length of 40 ft**.

Geometry, angles, tensions, and lateral force are recalculated for each option.

If lateral force cannot be reduced to acceptable limits:
- A spreader bar or lift beam is required
- Bar or beam weight must be provided and included

---

## FLOW 11 — Sling Capacity Selection

For each sling leg, the app displays:
- Sling length
- Sling angle
- Calculated tension
- Minimum required WLL
- Recommended WLL

Material preference is applied before capacity sizing.

---

## FLOW 11A — Minimum Sling Requirement

The selected sling must have a working load limit **≥ calculated sling tension**.

---

## FLOW 11B — Recommended Sling Capacity

A recommended sling capacity equal to **1.5× calculated sling tension** is provided.

This factor applies **only to slings** and is never applied to shackles.

---

## FLOW 11C — Wire Rope Bend Radius (D/d) Validation

### Scope
This validation applies **only** to:
- Wire rope slings
- Basket hitch configurations
- Any condition where the sling body is bent around hardware or structural members

This validation does not apply to:
- Synthetic slings
- Chain slings
- Vertical or choker hitches

### Definitions
- **d** = Nominal wire rope diameter
- **D** = Effective bearing diameter of the smallest contact surface

If multiple contact points exist, the **smallest D governs**.

### Assumed Manufacturer Basis
Unless splice type is explicitly declared, the app assumes **mechanical splice requirements**.

### Minimum D/d Requirements
- Mechanical splice: **D/d ≥ 20**
- Hand-tucked splice (if declared): **D/d ≥ 10**

### Evaluation Logic
- If **D/d ≥ required minimum**, basket capacity remains valid
- If **D/d < required minimum**, basket capacity is invalid

### Failure Handling
If the requirement is not satisfied:
- Basket-hitch capacity selection is **blocked**
- Governing message is displayed:
  > “Wire rope basket ratings assume a minimum bend radius. The current D/d ratio does not meet required limits. Published basket capacity may not apply.”

### User Resolution Options
- Increase bearing diameter
- Select a larger wire rope sling
- Change hitch configuration
- Use a spreader bar or lift beam

---

## FLOW 12 — Shackle Load Determination

Each shackle load is calculated by summing all sling tensions terminating at that shackle.

---

## FLOW 13 — Shackle Selection

Only **carbon steel shackles with a 6:1 design factor** are permitted.

The selected shackle must have a WLL **≥ applied shackle load or ≥ sling WLL**, as applicable.

No additional safety factors are applied to shackles.

---

## FLOW 14 — Weight Accumulation

All sling, shackle, and bar or beam weights are added to the crane hook load.

Bar or beam weight is mandatory and may not be estimated.

---

## FLOW 15 — Hook Height & Clearance

Hook height is calculated for informational and clearance purposes only.

Hook height never governs sling geometry, angles, or selection.

---

## FLOW 16 — Audit & Governing Summary

For each crane, the app presents:
- Bottom rigging summary
- Top rigging summary
- Hardware summary

The governing condition is explicitly identified with the statement:

**“This is what limits the lift.”**

The following disclaimer is always displayed:

**“Load acceptability and lug integrity are the user’s responsibility.”**

---
