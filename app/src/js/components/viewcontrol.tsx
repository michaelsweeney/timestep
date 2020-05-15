import React, { useState, useEffect } from 'react';

import { HeatmapControl } from './charts/heatmapcontrol';
import { HistogramControl } from './charts/histogramcontrol';
import { MultiLineControl } from './charts/multilinecontrol';
import { ScatterControl } from './charts/scattercontrol';

const ViewControl = props => {
  if (props.activeView == 'Histogram') {
    return (
      <HistogramControl
        seriesOptions={props.seriesOptions}
        units={props.units}
        files={props.files}
        timestepType={props.timestepType}
        seriesLookupObj={props.seriesLookupObj}
      />
    );
  }
  if (props.activeView == 'Heatmap') {
    return (
      <HeatmapControl
        seriesOptions={props.seriesOptions}
        units={props.units}
        files={props.files}
        timestepType={props.timestepType}
        seriesLookupObj={props.seriesLookupObj}
      />
    );
  }
  if (props.activeView == 'MultiLine') {
    return (
      <MultiLineControl
        seriesOptions={props.seriesOptions}
        units={props.units}
        files={props.files}
        timestepType={props.timestepType}
        seriesLookupObj={props.seriesLookupObj}
      />
    );
  }
  if (props.activeView == 'Scatter') {
    return (
      <ScatterControl
        seriesOptions={props.seriesOptions}
        units={props.units}
        files={props.files}
        timestepType={props.timestepType}
        seriesLookupObj={props.seriesLookupObj}
      />
    );
  }
};

export { ViewControl };
