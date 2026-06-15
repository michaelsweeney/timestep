import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'src/store';

// "+ Split chart" accent button in the topbar. Adds a new pane (view) and
// focuses it — the same add+focus path the old tab `+` used (next id =
// max(existing)+1), now with no 4-view cap.
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
  const { viewIDs } = props;

  const handleSplit = () => {
    const nextViewID = Math.max(...viewIDs) + 1;
    props.actions.addView(nextViewID);
    props.actions.setActiveView(nextViewID);
  };

  return (
    <button className={classes.btn} onClick={handleSplit}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Split chart
    </button>
  );
};

const mapStateToProps = state => ({ viewIDs: state.session.viewArray });

export default connect(mapStateToProps)(SplitButton);
