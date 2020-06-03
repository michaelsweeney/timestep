import React, { useState, useEffect } from 'react';

import { HeatmapControl } from './charts/heatmapcontrol';
import { HistogramControl } from './charts/histogramcontrol';
import { MultiLineControl } from './charts/multilinecontrol';
import { ScatterControl } from './charts/scattercontrol';

const ViewControl = props => {
  const { units, files, timestepType, seriesLookupObj, seriesOptions } = props;

  if (props.activeView == 'Histogram') {
    return (
      <div className="view-container">
        <HistogramControl
          seriesOptions={seriesOptions}
          units={units}
          files={files}
          timestepType={timestepType}
          seriesLookupObj={seriesLookupObj}
        />
      </div>
    );
  }
  if (props.activeView == 'Heatmap') {
    return (
      <div className="view-container">
        <HeatmapControl
          seriesOptions={seriesOptions}
          units={units}
          files={files}
          timestepType={timestepType}
          seriesLookupObj={seriesLookupObj}
        />
      </div>
    );
  }
  if (props.activeView == 'MultiLine') {
    return (
      <div className="view-container">
        <MultiLineControl
          seriesOptions={seriesOptions}
          units={units}
          files={files}
          timestepType={timestepType}
          seriesLookupObj={seriesLookupObj}
        />
      </div>
    );
  }
  if (props.activeView == 'Scatter') {
    return (
      <div className="view-container">
        <ScatterControl
          seriesOptions={seriesOptions}
          units={units}
          files={files}
          timestepType={timestepType}
          seriesLookupObj={seriesLookupObj}
        />
      </div>
    );
  }
};

export { ViewControl };
