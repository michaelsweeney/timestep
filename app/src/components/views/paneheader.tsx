import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TuneIcon from '@material-ui/icons/Tune';
import SaveAltIcon from '@material-ui/icons/SaveAlt';

// Per-pane header bar: "PANE N · ‹TYPE›" with Options (sliders) and Export
// (download) icon buttons. These reveal the pane's existing Options / Export
// controls (the chart's ControlsWrapper tabs) without relocating the wiring.
const useStyles = makeStyles(
  {
    head: {
      flex: 'none',
      height: 34,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 12px',
      boxSizing: 'border-box',
      borderBottom: '1px solid var(--hairline)',
      background: 'var(--panel)'
    },
    title: {
      fontFamily: 'var(--sans)',
      fontWeight: 600,
      fontSize: 11,
      lineHeight: 1,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--ink-faint)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    type: { color: 'var(--accent)', fontWeight: 600 },
    tools: { marginLeft: 'auto', display: 'flex', gap: 6 },
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
  const { paneIndex, chartType, onOptions, onExport } = props;

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className={classes.head}>
      <span className={classes.title}>
        Pane {paneIndex + 1} · <span className={classes.type}>{chartType}</span>
      </span>
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

export default PaneHeader;
