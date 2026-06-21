import React from 'react';
import FileMenu from './filemenu';
import SettingsMenu from './settingsmenu';
import SplitButton from './splitbutton';
import SessionSummary from './sessionsummary';
import UnitToggle from './unittoggle';
import { makeStyles } from '@material-ui/core/styles';

// bnd-viz-style flat topbar driven by the CSS token set:
//   timestep | [Files (N)] [+ Split chart]   …   ‹dataset·units›  [⚙]
// Wordmark: the original lowercase two-tone logo in Roboto (--sans) — the face
// the first timestep shipped with — "timest" in --accent (Indigo) with the
// trailing "ep" in --brand-red (Pink A400), the original Material palette.
// Medium weight, not heavy.
const useStyles = makeStyles(
  {
    root: {
      flex: 'none',
      height: 72,
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      padding: '0 28px',
      boxSizing: 'border-box',
      borderBottom: '1px solid var(--hairline)',
      background: 'var(--panel)',
      width: '100%',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },
    wordmark: {
      fontFamily: 'var(--sans)',
      fontWeight: 500,
      fontSize: 34,
      lineHeight: 1,
      letterSpacing: 0,
      color: 'var(--ink)',
      userSelect: 'none',
      // extra breathing room between the logo and the Files / Split cluster,
      // on top of the row gap
      marginRight: 32
    },
    blue: { color: 'var(--accent)' },
    red: { color: 'var(--brand-red)' },
    spacer: { flex: 1 }
  },
  { name: 'header' }
);

const Header = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.wordmark}>
        <span className={classes.blue}>timest</span>
        <span className={classes.red}>ep</span>
      </div>
      <FileMenu />
      <SplitButton />
      <div className={classes.spacer} />
      <SessionSummary />
      <UnitToggle />
      <SettingsMenu />
    </div>
  );
};

export default Header;
