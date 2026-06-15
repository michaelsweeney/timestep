import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'src/store';
import { INTERVALS } from './views/intervals';

// Global reporting interval selector for comparison workflows. It writes a
// topbar default and applies the same interval to every current pane; each pane
// can still diverge afterward from its own header.
const useStyles = makeStyles(
  {
    select: {
      appearance: 'none',
      cursor: 'pointer',
      flex: 'none',
      background: 'var(--panel-2)',
      color: 'var(--ink)',
      border: '1px solid var(--hairline-2)',
      borderRadius: 4,
      fontFamily: 'var(--sans)',
      fontWeight: 600,
      fontSize: 12,
      lineHeight: 1,
      padding: '6px 24px 6px 9px',
      backgroundImage:
        'linear-gradient(45deg, transparent 50%, var(--ink-dim) 50%), linear-gradient(135deg, var(--ink-dim) 50%, transparent 50%)',
      backgroundPosition:
        'calc(100% - 13px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px)',
      backgroundSize: '4px 4px, 4px 4px',
      backgroundRepeat: 'no-repeat',
      transition: 'border-color .12s',
      '&:hover': { borderColor: 'var(--accent)' },
      '&:focus': { outline: 'none', borderColor: 'var(--accent)' }
    }
  },
  { name: 'interval-select' }
);

const IntervalSelect = props => {
  const classes = useStyles();
  const interval = props.intervalDefault || 'Hourly';

  const handleChange = e => {
    props.actions.setGlobalInterval(e.target.value);
  };

  return (
    <select
      className={classes.select}
      value={interval}
      onChange={handleChange}
      title="Global interval"
      aria-label="global interval"
    >
      {INTERVALS.map(t => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
};

const mapStateToProps = state => ({
  intervalDefault: state.session.intervalDefault
});

export default connect(mapStateToProps)(IntervalSelect);
