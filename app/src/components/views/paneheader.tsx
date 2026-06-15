import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TuneIcon from '@material-ui/icons/Tune';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import { connect } from 'src/store';

// Per-pane header — the single place a pane's chart is configured:
//   PANE N · [chart-type ▾] · [interval ▾]            [Options] [Export]
// Chart-type + interval are per-view and dispatch on this pane's viewID; the
// pane's series/options/export live in its own bottom strip. Flat token-styled
// native selects so they don't read as Material.
const CHART_TYPES = ['Heatmap', 'Multiline', 'Scatter', 'Histogram', 'Statistics'];
const INTERVALS = [
  'HVAC Timestep',
  'Zone Timestep',
  'Hourly',
  'Daily',
  'Monthly',
  'Run Period'
];

const useStyles = makeStyles(
  {
    head: {
      flex: 'none',
      height: 34,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 12px',
      boxSizing: 'border-box',
      borderBottom: '1px solid var(--hairline)',
      background: 'var(--panel)'
    },
    label: {
      fontFamily: 'var(--sans)',
      fontWeight: 600,
      fontSize: 11,
      lineHeight: 1,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--ink-faint)',
      whiteSpace: 'nowrap',
      flex: 'none'
    },
    sep: { color: 'var(--ink-faint)', flex: 'none' },
    // Flat token-styled native selects. EnergyPlus-y values, but these are the
    // chart's own config labels → keep them sans, accent text to read as active.
    select: {
      appearance: 'none',
      cursor: 'pointer',
      background: 'var(--panel-2)',
      color: 'var(--accent)',
      border: '1px solid var(--hairline-2)',
      borderRadius: 4,
      fontFamily: 'var(--sans)',
      fontWeight: 600,
      fontSize: 12,
      lineHeight: 1,
      padding: '5px 22px 5px 8px',
      // chevron drawn with a background gradient so we don't ship an icon
      backgroundImage:
        'linear-gradient(45deg, transparent 50%, var(--ink-dim) 50%), linear-gradient(135deg, var(--ink-dim) 50%, transparent 50%)',
      backgroundPosition:
        'calc(100% - 12px) calc(50% - 1px), calc(100% - 8px) calc(50% - 1px)',
      backgroundSize: '4px 4px, 4px 4px',
      backgroundRepeat: 'no-repeat',
      transition: 'border-color .12s',
      '&:hover': { borderColor: 'var(--accent)' },
      '&:focus': { outline: 'none', borderColor: 'var(--accent)' }
    },
    intervalSelect: { color: 'var(--ink)', fontWeight: 500 },
    tools: { marginLeft: 'auto', display: 'flex', gap: 6, flex: 'none' },
    iconbtn: {
      appearance: 'none',
      cursor: 'pointer',
      width: 26,
      height: 26,
      borderRadius: 4,
      border: '1px solid transparent',
      background: 'transparent',
      color: 'var(--ink-dim)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color .12s, border-color .12s',
      '&:hover': {
        color: 'var(--ink)',
        borderColor: 'var(--hairline-2)'
      }
    }
  },
  { name: 'pane-header' }
);

const PaneHeader = props => {
  const classes = useStyles();
  const {
    paneIndex,
    viewID,
    chartType,
    timestepType,
    onOptions,
    onExport
  } = props;

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  // Switching chart type normally resets the pane's series/loaded data, because
  // the chart types consume different selection shapes (Multiline = array,
  // Scatter = x/y/z, Heatmap/Histogram = a single key). The exception:
  // Heatmap and Histogram share an identical single-series shape, so toggling
  // between those two keeps the selection — view a variable as a heatmap, flip
  // to its histogram, and back, without re-picking it.
  const SINGLE_SERIES = ['Heatmap', 'Histogram'];
  const handleChartType = e => {
    const next = e.target.value;
    const sameShape =
      SINGLE_SERIES.includes(chartType) && SINGLE_SERIES.includes(next);
    if (!sameShape) {
      props.actions.changeSelectedSeries([], viewID);
      props.actions.changeSelectedSeriesLabel(null, viewID);
      props.actions.changeLoadedArray({}, viewID);
    }
    props.actions.changeChartType(next, viewID);
  };

  const handleInterval = e => {
    props.actions.changeTimestepType(e.target.value, viewID);
  };

  return (
    <div className={classes.head} onClick={e => e.stopPropagation()}>
      <span className={classes.label}>Pane {paneIndex + 1}</span>
      <span className={classes.sep}>·</span>
      <select
        className={classes.select}
        value={chartType}
        onChange={handleChartType}
        title="Chart type"
      >
        {CHART_TYPES.map(t => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <span className={classes.sep}>·</span>
      <select
        className={classes.select + ' ' + classes.intervalSelect}
        value={timestepType}
        onChange={handleInterval}
        title="Interval"
      >
        {INTERVALS.map(t => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <div className={classes.tools}>
        <button
          className={classes.iconbtn}
          title="Options"
          onClick={stop(onOptions)}
        >
          <TuneIcon style={{ fontSize: 16 }} />
        </button>
        <button
          className={classes.iconbtn}
          title="Export / copy"
          onClick={stop(onExport)}
        >
          <SaveAltIcon style={{ fontSize: 16 }} />
        </button>
      </div>
    </div>
  );
};

const mapStateToProps = (state, ownProps) => {
  const view = state.views[ownProps.viewID];
  return {
    chartType: view.chartType,
    timestepType: view.timestepType
  };
};

export default connect(mapStateToProps)(PaneHeader);
