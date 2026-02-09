import { BottomRiggingResult } from "./BottomRiggingResult";
import { TopRiggingResult } from "./TopRiggingResult";
import { LateralPressureResult } from "./LateralPressureResult";
import { BeamEvaluationResult } from "./BeamEvaluationResult";
import { HookHeightInfo } from "./HookHeightInfo";
import { GoverningSummary } from "./GoverningSummary";
import { EngineInput } from "./EngineInput";

export interface EngineOutput {
  input: EngineInput;
  bottomRigging: BottomRiggingResult;
  lateralPressure: LateralPressureResult;
  longerSlingMitigation: any | null;
  beamEvaluation: BeamEvaluationResult;
  topRigging: TopRiggingResult | null;
  hookHeightInfo: HookHeightInfo;
  governingSummary: GoverningSummary;
  disclaimer: string;
}
