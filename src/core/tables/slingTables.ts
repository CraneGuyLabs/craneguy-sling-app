/**
 * SLING TABLES
 * ============
 * Authoritative sling capacity tables for the Sling App engine.
 *
 * NOTES:
 * - All capacities are Working Load Limits (WLL)
 * - Units: pounds (lb)
 * - Ordered from lowest to highest
 * - No reductions or multipliers applied here
 * - Hitch validity is enforced elsewhere
 */

/**
 * SYNTHETIC ROUND SLINGS — Vertical Rating
 */
export const SyntheticRoundSling = [
  { size: "1 ton (purple)", wll: 2000 },
  { size: "2 ton (green)", wll: 4000 },
  { size: "3 ton (yellow)", wll: 6000 },
  { size: "4 ton (tan)", wll: 8000 },
  { size: "5 ton (red)", wll: 10000 },
  { size: "6 ton (white)", wll: 12000 },
  { size: "7.5 ton (blue)", wll: 15000 },
  { size: "10 ton (orange)", wll: 20000 },
  { size: "12.5 ton (gray)", wll: 25000 },
  { size: "15.5 ton (brown)", wll: 31000 },
  { size: "33 ton (olive)", wll: 66000 },
  { size: "45 ton (black)", wll: 90000 },
  { size: "50 ton (black)", wll: 100000 },
  { size: "55 ton (black)", wll: 110000 },
];

/**
 * WIRE ROPE SLINGS — Vertical Rating
 * (6×19 / 6×36 EIPS)
 */
export const WireRopeSling = [
  { size: "1/2 in", wll: 8600 },
  { size: "5/8 in", wll: 13200 },
  { size: "3/4 in", wll: 19600 },
  { size: "7/8 in", wll: 26600 },
  { size: "1 in", wll: 34200 },
  { size: "1-1/8 in", wll: 43200 },
  { size: "1-1/4 in", wll: 53200 },
  { size: "1-1/2 in", wll: 72000 },
  { size: "1-3/4 in", wll: 96000 },
  { size: "2 in", wll: 120000 },
];

/**
 * CHAIN SLINGS — Vertical Rating
 * Grade 80
 */
export const ChainSling = [
  { size: "1/4 in G80", wll: 3500 },
  { size: "5/16 in G80", wll: 4500 },
  { size: "3/8 in G80", wll: 7100 },
  { size: "1/2 in G80", wll: 12000 },
  { size: "5/8 in G80", wll: 18100 },
  { size: "3/4 in G80", wll: 28300 },
];
