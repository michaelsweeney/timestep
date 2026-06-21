import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'src/store';

// "+ Split chart" accent button in the topbar. Splits the focused pane: adds a
// new pane seeded with a copy of the active pane's chart type, interval, series
// selection and already-loaded data, then focuses it. So you get a working copy
// to re-aim (swap a series for a side-by-side comparison) rather than a blank
// pane. Capped at MAX_PANES — the button disables once the cap is reached.
const MAX_PANES = 2;

const useStyles = makeStyles(
  {
    btn: {
      appearance: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      flex: 'none',
      height: 40,
      boxSizing: 'border-box',
      borderRadius: 5,
      border: '1px solid var(--accent)',
      background: 'transparent',
      color: 'var(--accent)',
      fontFamily: 'var(--sans)',
      fontWeight: 600,
      fontSize: 15,
      padding: '0 16px',
      lineHeight: 1,
      transition: 'background .15s, color .15s',
      '&:hover': { background: 'var(--accent)', color: 'var(--bg)' }
    },
    disabled: {
      cursor: 'default',
      borderColor: 'var(--hairline-2)',
      color: 'var(--ink-faint)',
      '&:hover': { background: 'transparent', color: 'var(--ink-faint)' }
    }
  },
  { name: 'split-button' }
);

const SplitButton = props => {
  const classes = useStyles();
  const { viewIDs, activeView, files } = props;
  const noFiles = !files || files.length === 0;
  const atCap = viewIDs.length >= MAX_PANES;
  const disabled = noFiles || atCap;

  const handleSplit = () => {
    if (disabled) return;
    const nextViewID = Math.max(...viewIDs) + 1;
    const seed = activeView
      ? {
          chartType: activeView.chartType,
          timestepType: activeView.timestepType,
          selectedSeries: activeView.selectedSeries,
          selectedSeriesLabel: activeView.selectedSeriesLabel,
          loadedObj: activeView.loadedObj,
          seriesOptions: activeView.seriesOptions,
          linked: activeView.linked
        }
      : undefined;
    props.actions.addView(nextViewID, seed);
    props.actions.setActiveView(nextViewID);
  };

  return (
    <button
      className={classes.btn + (disabled ? ' ' + classes.disabled : '')}
      onClick={handleSplit}
      disabled={disabled}
      title={
        noFiles
          ? 'Load a file to split into a second chart'
          : atCap
          ? `Limited to ${MAX_PANES} panes`
          : 'Split into a second chart'
      }
    >
      <span style={{ fontSize: 17, lineHeight: 1, position: 'relative', top: -1 }}>
        +
      </span>{' '}
      Split chart
    </button>
  );
};

const mapStateToProps = state => ({
  viewIDs: state.session.viewArray,
  activeView: state.views[state.session.activeViewID],
  files: state.session.files
});

export default connect(mapStateToProps)(SplitButton);
