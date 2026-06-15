import React from 'react';
import FileMenu from './filemenu';
import SettingsMenu from './settingsmenu';
import SplitButton from './splitbutton';
import SessionSummary from './sessionsummary';
import UnitToggle from './unittoggle';
import IntervalSelect from './intervalselect';
import { makeStyles } from '@material-ui/core/styles';

// bnd-viz-style flat topbar driven by the CSS token set:
//   TIME·STEP / ENERGYPLUS TIMESERIES | [Files (N)] [+ Split chart]
//      …  ‹dataset·units·interval›  [⚙]
// Wordmark mirrors bnd-viz's #wordmark: IBM Plex Sans 700, letter-spaced, the
// separator dot in --accent, with a small subtitle.
const useStyles = makeStyles(
  {
    root: {
      flex: 'none',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '0 16px',
      boxSizing: 'border-box',
      borderBottom: '1px solid var(--hairline)',
      background: 'var(--panel)',
      width: '100%',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },
    wordmark: {
      fontFamily: 'var(--sans)',
      fontWeight: 700,
      fontSize: 18,
      lineHeight: 1,
      letterSpacing: '0.14em',
      color: 'var(--ink)',
      userSelect: 'none'
    },
    dot: { color: 'var(--accent)' },
    sub: {
      display: 'block',
      marginTop: 3,
      fontFamily: 'var(--sans)',
      fontWeight: 500,
      fontSize: 9,
      letterSpacing: '0.16em',
      color: 'var(--ink-faint)'
    },
    vdiv: {
      width: 1,
      height: 26,
      background: 'var(--hairline-2)',
      flex: 'none'
    },
    spacer: { flex: 1 }
  },
  { name: 'header' }
);

const Header = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.wordmark}>
        TIME<span className={classes.dot}>·</span>STEP
        <span className={classes.sub}>ENERGYPLUS TIMESERIES</span>
      </div>
      <div className={classes.vdiv} />
      <FileMenu />
      <SplitButton />
      <div className={classes.spacer} />
      <SessionSummary />
      <UnitToggle />
      <IntervalSelect />
      <SettingsMenu />
    </div>
  );
};

export default Header;
