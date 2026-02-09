export interface BeamEvaluationResult {
  beamRequired: boolean;
  beamType?: string;
  beamWLL?: number;
  beamWeight: number;
  addedToRiggingWeight: boolean;
  governingReason?: string;
}
