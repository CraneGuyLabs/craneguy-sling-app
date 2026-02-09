/**
 * ENGINE INPUT
 * ============
 * Canonical input contract for the Sling App engine.
 */

export interface EngineInput {
  load: {
    /**
     * Total applied load (lb)
     */
    weight: number;
  };

  conditions: {
    /**
     * Sharp edges present at contact points
     */
    sharpEdgesPresent: boolean;
  };

  bottomRigging: {
    legs: Array<{
      id: string;

      /**
       * Load carried by this leg (lb)
       */
      loadShare: number;

      /**
       * Geometry at pick point
       */
      pickPoint: {
        verticalRise: number;
        horizontalOffset: number;
      };

      /**
       * Sling length (ft)
       */
      slingLength: number;
    }>;

    /**
     * Optional spreader bar or lift beam
     */
    beam?: {
      type: "spreader_bar" | "lift_beam";
      wll: number;
      weight: number;
      height: number;
    };
  };

  topRigging?: {
    legs: Array<{
      id: string;
      loadShare: number;
      pickPoint: {
        verticalRise: number;
        horizontalOffset: number;
      };
      slingLength: number;
    }>;
  };

  crane?: {
    /**
     * Maximum hook height (ft)
     */
    maxHookHeight?: number;

    /**
     * Minimum required block/headroom clearance (ft)
     */
    blockClearance?: number;
  };
}
