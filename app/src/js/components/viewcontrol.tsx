import React, { useState, useEffect } from 'react';

import { HeatmapControl } from './chartcontrol/heatmapcontrol';
import { HistogramControl } from './chartcontrol/histogramcontrol';
import { MultiLineControl } from './chartcontrol/multilinecontrol';
import { ScatterControl } from './chartcontrol/scattercontrol';
import { StatisticsControl } from './chartcontrol/statisticscontrol';

import { makeStyles } from '@material-ui/core/styles';
import { LandingPage } from './landingpage';

const useStyles = makeStyles(
  {
    root: {
      position: 'absolute',
      width: 'calc(100vw - 200px)',
      left: '175px',
      height: '98vh',
      boxSizing: 'border-box',
      overflowY: 'hidden',
      overflowX: 'hidden',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    }
  },
  { name: 'view-container' }
);

const ViewControl = props => {
  const { units, files, timestepType, seriesLookupObj, seriesOptions } = props;
  const classes = useStyles();

  if (files.length == 0) {
    return (
      <div className={classes.root}>
        <LandingPage />
      </div>
    );
  }

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
