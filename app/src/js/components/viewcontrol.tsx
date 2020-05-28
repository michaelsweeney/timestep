import React, { useState, useEffect } from 'react';

import { HeatmapControl } from './charts/heatmapcontrol';
import { HistogramControl } from './charts/histogramcontrol';
import { MultiLineControl } from './charts/multilinecontrol';
import { ScatterControl } from './charts/scattercontrol';



const ViewControl = props => {
  if (props.activeView == 'Histogram') {
    return (
      <div className="view-container">
        <HistogramControl
          seriesOptions={props.seriesOptions}
          units={props.units}
          files={props.files}
          timestepType={props.timestepType}
          seriesLookupObj={props.seriesLookupObj}
        />
      </div>
    );
  }
  if (props.activeView == 'Heatmap') {
    return (
      <div className="view-container">
        <HeatmapControl
          seriesOptions={props.seriesOptions}
          units={props.units}
          files={props.files}
          timestepType={props.timestepType}
          seriesLookupObj={props.seriesLookupObj}
        />
      </div>
    );
  }
  if (props.activeView == 'MultiLine') {
    return (
      <div className="view-container">
        <MultiLineControl
          seriesOptions={props.seriesOptions}
          units={props.units}
          files={props.files}
          timestepType={props.timestepType}
          seriesLookupObj={props.seriesLookupObj}
        />
      </div>
    );
  }
  if (props.activeView == 'Scatter') {
    return (
      <div className="view-container">
        <ScatterControl
          seriesOptions={props.seriesOptions}
          units={props.units}
          files={props.files}
          timestepType={props.timestepType}
          seriesLookupObj={props.seriesLookupObj}
        />
      </div>
    );
  }
};

export { ViewControl };
