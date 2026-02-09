export interface GoverningSummary {
  governingCondition: string;
  reason: string;
  statement: "This is what limits the lift.";
  severity: "governing" | "block";
}
