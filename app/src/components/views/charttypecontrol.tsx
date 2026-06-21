import React, { useState, useEffect } from 'react';

import { connect } from 'src/store';

import HeatmapControl from './chartcontrol/heatmapcontrol';
import HistogramControl from './chartcontrol/histogramcontrol';
import MultilineControl from './chartcontrol/multilinecontrol';
import ScatterControl from './chartcontrol/scattercontrol';
import StatisticsControl from './chartcontrol/statisticscontrol';

import { makeStyles } from '@material-ui/core/styles';
import { LandingPage } from './landingpage';
import PaneHeader from './paneheader';
import { INTERVALS } from './intervals';
import { getAllSeries, getSeriesLookupObj } from 'src/sql';

const useStyles = makeStyles(
  {
    // A pane = [ paneHeader + chart ]. The shared sidebar lives at the workspace
    // level (MappedViews). The focus ring marks the active pane, only when more
    // than one pane is shown.
    root: {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      '&::-webkit-scrollbar': { display: 'none' }
    },
    focused: {
      boxShadow: 'inset 0 0 0 2px var(--accent)'
    },
    chartArea: {
      flex: 1,
      minHeight: 0,
      position: 'relative',
      overflow: 'hidden'
    }
  },
  { name: 'view-container' }
);

const ChartTypeControl = props => {
  const classes = useStyles();
  const { viewID, paneDims, multiPane, paneIndex } = props;

  const { files, units, activeViewID } = props;
  const { timestepType, chartType } = props.view;

  const viewActive = activeViewID == viewID ? true : false;
  const rootClass =
    classes.root + (viewActive && multiPane ? ' ' + classes.focused : '');
  const focusPane = () => props.actions.setActiveView(viewID);

  // Per-pane Options/Export popovers (from the pane header) toggle these tabs in
  // the chart's existing ControlsWrapper without dismantling the load wiring.
  const [forcedTab, setForcedTab] = useState<string | null>(null);

  useEffect(() => {
    getAllSeries(files).then(ar => {
      let parsed = getSeriesLookupObj({
        array: ar,
        units: units,
        files: files,
        timestepType: timestepType
      });
      props.actions.setSeriesOptions(parsed, viewID);

      // Count series per reporting frequency so the interval pickers can
      // advertise how much data backs each option ("Hourly [62]"). Reuses the
      // dictionary already fetched here rather than re-querying.
      const counts = Object.fromEntries(INTERVALS.map(i => [i, 0]));
      ar.forEach(r => {
        counts[r.ReportingFrequency] = (counts[r.ReportingFrequency] || 0) + 1;
      });
      props.actions.setIntervalCounts(counts);
    });
  }, [files, units, timestepType]);

  const propobj = {
    viewID: viewID,
    paneDims: paneDims,
    forcedTab: forcedTab,
    onForcedTabHandled: () => setForcedTab(null)
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
        <LandingPage />
      </div>
    );
  }

  return (
    <div className={rootClass} onClick={focusPane}>
      <PaneHeader
        viewID={viewID}
        paneIndex={paneIndex}
        multiPane={multiPane}
        onOptions={() => setForcedTab('tab-options')}
        onExport={() => setForcedTab('tab-export')}
      />
      <div className={classes.chartArea}>{chartobj[chartType]}</div>
    </div>
  );
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
