import React, { useState, useEffect, useRef } from 'react';

import connect from '../connect';

import * as sizeof from 'object-sizeof';

import HeatmapControl from './chartcontrol/heatmapcontrol';
import HistogramControl from './chartcontrol/histogramcontrol';
import MultiLineControl from './chartcontrol/multilinecontrol';
import ScatterControl from './chartcontrol/scattercontrol';
import StatisticsControl from './chartcontrol/statisticscontrol';

import { makeStyles } from '@material-ui/core/styles';
import { LandingPage } from './landingpage';

import { getAllSeries } from './sql';

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

const parseAllSeries = config => {
  const { array, units, timestepType, files } = config;
  const filtered = array.filter(f => {
    return f.ReportingFrequency == timestepType;
  });
  const seriesLookupObj = {};

  filtered.forEach(o => {
    let key = o.key;
    let name;
    if (units == 'ip') {
      if (files.length > 1) {
        name = o.name_ip_multi;
      } else if (files.length == 1) {
        name = o.name_ip_single;
      } else console.warn('files length parsing error', files.length, files);
    }
    if (units == 'si') {
      if (files.length > 1) {
        name = o.name_si_multi;
      } else if (files.length == 1) {
        name = o.name_si_single;
      } else console.warn('files length parsing error', files.length, files);
    }
    seriesLookupObj[name] = key;
  });
  return seriesLookupObj;
};

const ViewControl = props => {
  const classes = useStyles();
  const container = useRef(null);
  const tempViewID = 1;
  const { files, units, containerDims } = props.session;
  const { timestepType, viewType, seriesOptions } = props.views[tempViewID];

  useEffect(() => {
    getAllSeries(files).then(ar => {
      let parsed = parseAllSeries({
        array: ar,
        units: units,
        files: files,
        timestepType: timestepType
      });
      console.log(parsed);
      props.actions.setSeriesOptions(parsed, tempViewID);
    });
  }, [files, units, timestepType]);

  const optionArray = Object.keys(seriesOptions);

  console.log('redux session size: ', sizeof(props.session) / 1e6, ' MB');

  console.log('redux view size: ', sizeof(props.views) / 1e6);

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
    seriesOptions: optionArray,
    seriesLookupObj: seriesOptions,
    units: units,
    files: files,
    dims: containerDims,
    timestepType: timestepType
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

export default connect(mapStateToProps)(ViewControl);
