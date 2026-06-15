// Shared plot-dimension math for the chart controls. Each pane measures itself
// (see PaneFrame) and passes its box as `paneDims`; the chart's plot area is the
// pane minus the in-pane sidebar (width) and the controls tray (height). Keeping
// this in one place means the five controls can't drift apart.
export const SIDEBAR_WIDTH = 150;

export interface Dims {
  width: number;
  height: number;
}

export const getPlotDims = (
  paneDims: Dims | undefined,
  controlsHeight: number
): Dims => ({
  width: Math.max((paneDims?.width ?? 0) - SIDEBAR_WIDTH, 200),
  height: Math.max((paneDims?.height ?? 0) - controlsHeight, 200)
});
