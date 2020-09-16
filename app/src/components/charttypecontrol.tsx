import React, { useState, useEffect, useRef } from 'react';

import connect from '../store/connect';

import HeatmapControl from './chartcontrol/heatmapcontrol';
import HistogramControl from './chartcontrol/histogramcontrol';
import MultiLineControl from './chartcontrol/multilinecontrol';
import ScatterControl from './chartcontrol/scattercontrol';
import StatisticsControl from './chartcontrol/statisticscontrol';

import { makeStyles } from '@material-ui/core/styles';
import { LandingPage } from './landingpage';
import ViewSidebar from './viewsidebar';
import { getAllSeries } from './sql';
import { getSeriesLookupObj } from './formatseries';
const useStyles = makeStyles(
  {
    root: {
      width: '100vw',
      display: 'inline-block',
      height: 'calc(100vh - 115px)',
      boxSizing: 'border-box',
      overflow: 'hidden',
      whitespace: 'nowrap',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    },
    sidebar: { height: '100%' },
    view: {
      verticalAlign: 'top',
      height: '100%',
      margin: 10,
      padding: 10,
      display: 'inline-block',
      width: 'calc(100% - 200px)',
      boxSizing: 'border-box',
      overflow: 'hidden',
      whitespace: 'nowrap'
    }
  },
  { name: 'view-container' }
);

const ChartTypeControl = props => {
  const classes = useStyles();
  const container = useRef(null);
  const { viewID, viewActive } = props;

  const { files, units, activeViewID } = props.session;
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
      width: Math.max(node.getBoundingClientRect()['width'] - 150, 400),
      height: Math.max(node.getBoundingClientRect()['height'] - 100, 400)
    };
  };

  // get initial dims after mount
  useEffect(() => {
    let dims = getContainerDims(container.current);
    props.actions.setContainerDims(dims);
  }, [activeViewID]);

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
        <div className={classes.sidebar}>
          <ViewSidebar viewID={viewID} />
        </div>
        {/* <div className={classes.view}> {chartobj[chartType]}</div> */}
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
