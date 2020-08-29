import React, { useState, useEffect, useRef } from 'react';

import connect from '../connect';

import HeatmapControl from './chartcontrol/heatmapcontrol';
import HistogramControl from './chartcontrol/histogramcontrol';
import MultiLineControl from './chartcontrol/multilinecontrol';
import ScatterControl from './chartcontrol/scattercontrol';
import StatisticsControl from './chartcontrol/statisticscontrol';

import { makeStyles } from '@material-ui/core/styles';
import { LandingPage } from './landingpage';

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

const ViewTypeControl = props => {
  const classes = useStyles();
  const container = useRef(null);
  const { viewID } = props;
  const { files, units } = props.session;
  const { timestepType, viewType } = props.views[viewID];

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
      width: node.getBoundingClientRect()['width'],
      height: node.getBoundingClientRect()['height']
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
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        let dims = getContainerDims(container.current);
        props.actions.setContainerDims(dims);
      }, 250);
    }
    let resizeTimer;
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const propobj = {
    viewID: viewID
  };

  const viewobj = {
    Histogram: <HistogramControl {...propobj} />,
    Heatmap: <HeatmapControl {...propobj} />,
    Scatter: <ScatterControl {...propobj} />,
    MultiLine: <MultiLineControl {...propobj} />,
    Statistics: <StatisticsControl {...propobj} />
  };
  return (
    <div ref={container} className={classes.root}>
      {files.length == 0 ? <LandingPage /> : viewobj[viewType]}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    ...state
  };
};

export default connect(mapStateToProps)(ViewTypeControl);
