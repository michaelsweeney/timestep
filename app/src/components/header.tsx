import React from 'react';
import FileMenu from './filemenu';
import SettingsMenu from './settingsmenu';
import SplitButton from './splitbutton';
import SessionSummary from './sessionsummary';
import { makeStyles } from '@material-ui/core/styles';

// Flat dark topbar matching the conservative split-pane mockup:
//   [ timestep ] | [Files (N)] [+ Split chart]   …  ‹dataset·units·interval› [⚙]
// Colors are driven from the MUI theme (dark palette + brand indigo/pink).
const useStyles = makeStyles(
  theme => {
    const dark = theme.palette.type === 'dark';
    return {
      root: {
        flex: 'none',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 16px',
        boxSizing: 'border-box',
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        width: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      },
      wordmark: {
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontWeight: 700,
        fontSize: 19,
        lineHeight: 1,
        letterSpacing: '0.02em',
        userSelect: 'none'
      },
      a: { color: dark ? '#8c9eff' : '#3f51b5' },
      b: { color: dark ? '#ff5c8d' : '#f50057' },
      vdiv: {
        width: 1,
        height: 26,
        background: theme.palette.divider,
        flex: 'none'
      },
      spacer: { flex: 1 }
    };
  },
  { name: 'header' }
);

const Header = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <span className={classes.wordmark}>
        <span className={classes.a}>time</span>
        <span className={classes.b}>step</span>
      </span>
      <div className={classes.vdiv} />
      <FileMenu />
      <SplitButton />
      <div className={classes.spacer} />
      <SessionSummary />
      <SettingsMenu />
    </div>
  );
};

export default Header;
