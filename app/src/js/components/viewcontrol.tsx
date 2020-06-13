import React, { useState, useEffect } from 'react';

import { HeatmapControl } from './charts/heatmapcontrol';
import { HistogramControl } from './charts/histogramcontrol';
import { MultiLineControl } from './charts/multilinecontrol';
import { ScatterControl } from './charts/scattercontrol';
import { StatisticsControl } from './charts/statisticscontrol';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      position: 'absolute',
      width: 'calc(100vw - 200px)',
      left: '175px',
      height: '100vh',
      padding: '20px',
      boxSizing: 'border-box'
    }
  },
  { name: 'view-container' }
);

const ViewControl = props => {
  const { units, files, timestepType, seriesLookupObj, seriesOptions } = props;
  const classes = useStyles();

  if (props.activeView == 'Histogram') {
    return (
      <div className={classes.root}>
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
      <div className={classes.root}>
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
      <div className={classes.root}>
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
      <div className={classes.root}>
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
  if (props.activeView == 'Statistics') {
    return (
      <div className={classes.root}>
        <StatisticsControl
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
