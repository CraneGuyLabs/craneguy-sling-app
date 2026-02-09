export interface LateralPressureResult {
  lateralForce: number;
  lateralPercent: number;
  status:
    | "ideal"
    | "acceptable-with-warning"
    | "mitigated-with-longer-slings"
    | "exceeds-limit";

  mitigationRequired: boolean;

  selectedAlternative?: {
    slingLength: number;
    angleFromHorizontal: number;
    tension: number;
    lateralForce: number;
    lateralPercent: number;
  };

  evaluatedAlternatives: Array<{
    slingLength: number;
    angleFromHorizontal: number;
    tension: number;
    lateralForce: number;
    lateralPercent: number;
  }>;

  beamRequired?: boolean;
  failureReason?: string;
  caution?: string;
}
