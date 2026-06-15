import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'src/store';

// "+ Split chart" accent button in the topbar. Splits the focused pane: adds a
// new pane seeded with a copy of the active pane's chart type, interval, series
// selection and already-loaded data, then focuses it. So you get a working copy
// to re-aim (swap a series for a side-by-side comparison) rather than a blank
// pane. (next id = max(existing)+1, no view cap.)
const useStyles = makeStyles(
  {
    btn: {
      appearance: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      flex: 'none',
      borderRadius: 4,
      border: '1px solid var(--accent)',
      background: 'transparent',
      color: 'var(--accent)',
      fontFamily: 'var(--sans)',
      fontWeight: 600,
      fontSize: 13,
      padding: '7px 11px',
      lineHeight: 1,
      transition: 'background .15s, color .15s',
      '&:hover': { background: 'var(--accent)', color: 'var(--bg)' }
    }
  },
  { name: 'split-button' }
);

const SplitButton = props => {
  const classes = useStyles();
  const { viewIDs, activeView } = props;

  const handleSplit = () => {
    const nextViewID = Math.max(...viewIDs) + 1;
    const seed = activeView
      ? {
          chartType: activeView.chartType,
          timestepType: activeView.timestepType,
          selectedSeries: activeView.selectedSeries,
          selectedSeriesLabel: activeView.selectedSeriesLabel,
          loadedObj: activeView.loadedObj,
          seriesOptions: activeView.seriesOptions
        }
      : undefined;
    props.actions.addView(nextViewID, seed);
    props.actions.setActiveView(nextViewID);
  };

  return (
    <button className={classes.btn} onClick={handleSplit}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Split chart
    </button>
  );
};

const mapStateToProps = state => ({
  viewIDs: state.session.viewArray,
  activeView: state.views[state.session.activeViewID]
});

export default connect(mapStateToProps)(SplitButton);
