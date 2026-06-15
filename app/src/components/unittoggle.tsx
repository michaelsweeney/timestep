import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'src/store';

// Global SI/IP unit toggle for the topbar (units are global: state.session.units,
// not per-view). Flat token-styled segmented control replacing the old Material
// Radio; dispatches the same changeUnits action.
const useStyles = makeStyles(
  {
    seg: {
      display: 'inline-flex',
      flex: 'none',
      border: '1px solid var(--hairline-2)',
      borderRadius: 4,
      overflow: 'hidden'
    },
    btn: {
      appearance: 'none',
      cursor: 'pointer',
      border: 0,
      background: 'transparent',
      color: 'var(--ink-dim)',
      fontFamily: 'var(--mono)',
      fontWeight: 600,
      fontSize: 12,
      lineHeight: 1,
      padding: '6px 11px',
      transition: 'background .12s, color .12s',
      '&:hover': { color: 'var(--ink)' },
      '& + $btn': { borderLeft: '1px solid var(--hairline-2)' }
    },
    on: {
      background: 'var(--accent)',
      color: 'var(--bg)',
      '&:hover': { color: 'var(--bg)' }
    }
  },
  { name: 'unit-toggle' }
);

const UnitToggle = props => {
  const classes = useStyles();
  const { units } = props;

  const set = (u: 'si' | 'ip') => () => {
    if (u !== units) props.actions.changeUnits(u);
  };

  return (
    <div className={classes.seg} role="group" aria-label="units">
      <button
        className={classes.btn + (units === 'si' ? ' ' + classes.on : '')}
        onClick={set('si')}
        aria-pressed={units === 'si'}
      >
        SI
      </button>
      <button
        className={classes.btn + (units === 'ip' ? ' ' + classes.on : '')}
        onClick={set('ip')}
        aria-pressed={units === 'ip'}
      >
        IP
      </button>
    </div>
  );
};

const mapStateToProps = state => ({ units: state.session.units });

export default connect(mapStateToProps)(UnitToggle);
