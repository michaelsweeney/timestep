import React, { useState, useEffect, useRef } from 'react';

import connect from '../store/connect';

import HeatmapControl from './chartcontrol/heatmapcontrol';
import HistogramControl from './chartcontrol/histogramcontrol';
import MultiLineControl from './chartcontrol/multilinecontrol';
import ScatterControl from './chartcontrol/scattercontrol';
import StatisticsControl from './chartcontrol/statisticscontrol';

import { makeStyles } from '@material-ui/core/styles';
import { LandingPage } from './landingpage';
import ViewHeader from './viewheader';
import { getAllSeries } from './sql';
import { getSeriesLookupObj } from './formatseries';
const useStyles = makeStyles(
  {
    root: {
      width: 'calc(100% - 175px)',
      display: 'inline-block',
      height: '100%',
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

const ChartTypeControl = props => {
  const classes = useStyles();
  const container = useRef(null);
  const { viewID, viewActive } = props;

  const { files, units } = props.session;
  const { timestepType, chartType } = props.views[viewID];

  useEffect(() => {
    getAllSeries(files).then(ar => {
      let parsed = getSeriesLookupObj({
        array: ar,
        units: units,
        files: files,
        timestepType: timestepType
      });
      props.actions.setSeriesOptions(parsed, viewID);
    });
  }, [files, units, timestepType]);

  const getContainerDims = node => {
    return {
      width: Math.max(node.getBoundingClientRect()['width'], 400),
      height: Math.max(node.getBoundingClientRect()['height'] - 100, 400)
    };
  };

  // get initial dims after mount
  useEffect(() => {
    let dims = getContainerDims(container.current);
    props.actions.setContainerDims(dims);
  }, []);

  // get dims on window resize
  useEffect(() => {
    function handleResize() {
      if (viewActive) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          let dims = getContainerDims(container.current);
          props.actions.setContainerDims(dims);
        }, 250);
      }
    }
    let resizeTimer;
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const propobj = {
    viewID: viewID
  };

  const chartobj = {
    Histogram: <HistogramControl {...propobj} />,
    Heatmap: <HeatmapControl {...propobj} />,
    Scatter: <ScatterControl {...propobj} />,
    MultiLine: <MultiLineControl {...propobj} />,
    Statistics: <StatisticsControl {...propobj} />
  };

  if (files.length == 0) {
    return (
      <div
        ref={container}
        className={classes.root}
        style={{ display: viewActive ? 'inline-block' : 'none' }}
      >
        {files.length == 0 ? <LandingPage /> : chartobj[chartType]}
      </div>
    );
  } else {
    return (
      <div
        ref={container}
        className={classes.root}
        style={{ display: viewActive ? 'inline-block' : 'none' }}
      >
        <ViewHeader viewID={viewID} />
        {chartobj[chartType]}
      </div>
    );
  }
};

const mapStateToProps = state => {
  return {
    ...state
  };
};

export default connect(mapStateToProps)(ChartTypeControl);
