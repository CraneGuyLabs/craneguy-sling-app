export interface TopRiggingResult {
  legs: Array<{
    legId: string;
    angleFromHorizontal: number;
    tension: number;
    sling: {
      type: string;
      minimumWLL: number;
      recommendedWLL: number;
      selectedSize: string;
      recommendedSize: string;
      verticalRise?: number;
    };
    shackle: {
      nominalSize: string;
      wll: number;
      weight: number;
    };
  }>;

  governingLegId: string;
  governingTension: number;
  governingReason: string;
}
