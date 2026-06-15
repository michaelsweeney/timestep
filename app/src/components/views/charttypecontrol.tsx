import React, { useState, useEffect } from 'react';

import { connect } from 'src/store';

import HeatmapControl from './chartcontrol/heatmapcontrol';
import HistogramControl from './chartcontrol/histogramcontrol';
import MultilineControl from './chartcontrol/multilinecontrol';
import ScatterControl from './chartcontrol/scattercontrol';
import StatisticsControl from './chartcontrol/statisticscontrol';

import { makeStyles } from '@material-ui/core/styles';
import { LandingPage } from './landingpage';
import ViewSidebar from './viewsidebar';
import { getAllSeries, getSeriesLookupObj } from 'src/sql';
const useStyles = makeStyles(
  theme => ({
    root: {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
      whitespace: 'nowrap',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    },
    // Focus ring marks which pane is "active" — only when more than one pane is
    // shown, so a lone pane isn't boxed for no reason.
    focused: {
      boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`
    },
    sidebar: {
      display: 'inline-block',
      height: '100%',
      width: '150px'
    },
    view: {
      verticalAlign: 'top',
      width: 'calc(100% - 150px)',
      height: '100%',
      display: 'inline-block',
      overflow: 'hidden',
      whitespace: 'nowrap'
    }
  }),
  { name: 'view-container' }
);

const ChartTypeControl = props => {
  const classes = useStyles();
  const { viewID, paneDims, multiPane } = props;

  const { files, units, activeViewID } = props;
  const { timestepType, chartType } = props.view;

  const viewActive = activeViewID == viewID ? true : false;
  const rootClass =
    classes.root + (viewActive && multiPane ? ' ' + classes.focused : '');
  const focusPane = () => props.actions.setActiveView(viewID);

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

  const propobj = {
    viewID: viewID,
    paneDims: paneDims
  };

  const chartobj = {
    Histogram: <HistogramControl {...propobj} />,
    Heatmap: <HeatmapControl {...propobj} />,
    Scatter: <ScatterControl {...propobj} />,
    Multiline: <MultilineControl {...propobj} />,
    Statistics: <StatisticsControl {...propobj} />
  };

  if (files.length == 0) {
    return (
      <div className={rootClass} onClick={focusPane}>
        {files.length == 0 ? <LandingPage /> : chartobj[chartType]}
      </div>
    );
  } else {
    return (
      <div className={rootClass} onClick={focusPane}>
        <div className={classes.sidebar}>
          <ViewSidebar viewID={viewID} />
        </div>
        <div className={classes.view}> {chartobj[chartType]}</div>
      </div>
    );
  }
};

const mapStateToProps = (state, ownProps) => {
  return {
    files: state.session.files,
    units: state.session.units,
    activeViewID: state.session.activeViewID,
    view: state.views[ownProps.viewID]
  };
};

export default connect(mapStateToProps)(ChartTypeControl);
