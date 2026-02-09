# CraneGuyLabs Sling App  
## Deterministic Evaluation Flow  
### v2.14 — ORDERED & UPDATED (FIELD-USE LOCKED)

---

## FLOW 0 — Scope Confirmation (Locked)

Below-the-hook rigging only.

Crane selection, crane capacity, setup, operation, swing, ground conditions, and personnel qualification remain the user’s responsibility.

The Sling App evaluates below-the-hook rigging geometry, forces, and hardware only.

---

## FLOW 1 — Configuration Setup (Locked)

Select:
- Number of cranes  
- Pick points per load  
- Spreader bars or lift beams per crane  
- Shared lugs  
- Shared load-side shackles  

---

## FLOW 1A — Multi-Crane Isolation Gate (Locked)

Each crane is evaluated in a fully independent calculation context.

- Geometry, sling length, sling angle, sling tension, and hardware sizing never propagate between cranes  
- Only load allocation may reference other cranes  

---

## FLOW 2 — Load Allocation & Distribution (Locked)

Distribute load based on:
- Center of gravity (CG)  
- Declared shared lugs  

Assign a load portion to each crane.

Rigging, hardware, bar, and beam weights are excluded at this stage.

---

## FLOW 3 — Geometry Input (Locked)

Input:
- Longitudinal distances (L)  
- Transverse distances (T)  
- Vertical pick depth (V)  

Rules:
- Vertical pick depth (V) is measured from the TOP of the load to the pick-point centerline  
- User-entered pick-to-pick distances override load dimensions  

---

## FLOW 4 — Geometry Resolution (Locked)

For each sling leg:
- Resolve effective L and T  
- Compute vertical rise using V  
- Derive sling length unless user override is active  
- Apply automatic hidden geometry adjustments for shackles, lugs, and hardware stack-up  

---

## FLOW 5 — Sling Definition (Locked)

Define sling type per leg.

- Bottom rigging and top rigging are defined separately  
- Effective bearing-to-bearing length includes all hidden geometry adjustments  

---

## FLOW 6 — Sling Angle Calculation (Locked)

For each sling leg:
- Measure sling angle at the pick point  
- Angle is measured from a horizontal reference line parallel to the pick-to-pick axis  
- Each sling leg is evaluated independently  

---

## FLOW 6A — Rigging Zone Classification (Locked)

Classify each sling leg as:
- Bottom Rigging (Load → Hook or Load → Bar)  
- Top Rigging (Hook → Bar or Hook → Beam)  

Classification governs minimum allowable sling angles.

---

## FLOW 7 — Angle Safety Gates (Locked)

- Bottom-of-hook or bottom-of-bar slings must be greater than 45 degrees from horizontal  
- Top-of-bar or top-of-beam slings must be at least 60 degrees from horizontal  

Violations block the lift.

---

## FLOW 8 — Sling Tension Calculation (Locked)

For each sling leg:

T = W_assigned / sin(theta)

- Calculated per sling leg  
- Identify governing sling leg per crane  
- Governing status is informational only and does not propagate sizing  

---

## FLOW 9 — Lateral Force Evaluation (Locked)

Evaluate lateral force as a percentage of total load:

- ≤10% → caution  
- >10% → automatic mitigation required  

---

## FLOW 10 — Automatic Mitigation Loop (Locked)

If lateral force exceeds 10%:
- Evaluate longer sling lengths up to the practical 40-ft cap  
- Recompute geometry, angles, tensions, and lateral force  

If lateral force cannot be reduced to ≤10%:
- Require a spreader bar or lift beam  
- Bar or beam weight inclusion is mandatory  

---

## FLOW 11 — Sling Capacity Selection (Locked)

For each sling leg (top and bottom), display:
- Sling length  
- Sling angle  
- Calculated sling tension  
- Minimum required sling WLL  
- Recommended sling WLL  

### FLOW 11A — Minimum Sling Requirement

Sling WLL must be greater than or equal to calculated sling tension.

### FLOW 11B — Recommended Sling (1.5× Rule)

Recommended sling WLL = 1.5 × calculated sling tension.

Rules:
- Applied once  
- Applies only to slings  
- Rounded up to the next available standard sling size  
- Does not propagate to shackles  

---

## FLOW 12 — Shackle Load Determination (Locked)

### FLOW 12A — Shackle Load Aggregation

For each shackle:
- Sum all terminating sling leg tensions  

### FLOW 12B — Shared Load-Side Shackle Aggregation

When multiple sling legs terminate at the same physical shackle:
- Sum all contributing sling tensions  
- Sling legs remain independent  
- Only the shackle is shared  

---

## FLOW 13 — Shackle Selection (Final, Locked)

Rules:
- Carbon steel shackles only  
- Pounds-first evaluation  
- 5:1 design factor  
- Alloy shackles are not permitted  

Shackle selection must satisfy both:
1. Shackle WLL ≥ applied shackle load  
2. If a sling is selected, shackle WLL ≥ sling WLL  

Notes:
- No 1.5× factor applies to shackles  
- No 1.25× factor applies when matching a known sling WLL  

---

## FLOW 14 — Weight Accumulation (Locked)

Add to each crane’s hook load:
- Sling weight  
- Shackle weight  
- Bar or beam weight  

Bar or beam weight is mandatory and may not be estimated.

---

## FLOW 15 — Hook Height & Clearance (Informational Only)

Hook height is derived for awareness and clearance only.

Hook height never governs:
- Sling geometry  
- Sling angle  
- Sling sizing  
- Shackle sizing  

---

## FLOW 16 — Audit & Governing Summary (Locked)

Display per crane:
- Bottom rigging table  
- Top rigging table  
- Hardware table  

Explicitly identify:
- Governing sling  
- Governing angle  
- Governing hardware  
- Any shared-shackle governing condition  

Always display:
- “This is what limits the lift.”  
- “Load acceptability and lug integrity are the user’s responsibility.”
