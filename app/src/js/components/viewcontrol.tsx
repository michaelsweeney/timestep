import React, { useState, useEffect, useRef } from 'react';

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

const ViewControl = props => {
  const { units, files, timestepType, seriesLookupObj, seriesOptions } = props;

  const classes = useStyles();

  const [containerDims, setContainerDims] = useState({
    width: 700,
    height: 500
  });

  const container = useRef(null);

  const getContainerDims = node => {
    return {
      width: node.getBoundingClientRect()['width'],
      height: node.getBoundingClientRect()['height']
    };
  };

  // get initial dims after mount
  useEffect(() => {
    let dims = getContainerDims(container.current);
    setContainerDims(dims);
  }, []);

  // get dims on window resize
  useEffect(() => {
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        let dims = getContainerDims(container.current);
        setContainerDims(dims);
      }, 250);
    }
    let resizeTimer;
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const propobj = {
    seriesOptions: seriesOptions,
    units: units,
    files: files,
    dims: containerDims,
    timestepType: timestepType,
    seriesLookupObj: seriesLookupObj
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
      {files.length == 0 ? <LandingPage /> : viewobj[props.activeView]}
    </div>
  );
};

export { ViewControl };
