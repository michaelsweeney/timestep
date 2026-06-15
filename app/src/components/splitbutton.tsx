import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'src/store';

// "+ Split chart" accent button in the topbar. Adds a new pane (view) and
// focuses it — the same add+focus path the old tab `+` used (next id =
// max(existing)+1), now with no 4-view cap.
const useStyles = makeStyles(
  theme => ({
    btn: {
      appearance: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      flex: 'none',
      borderRadius: 6,
      border: `1px solid ${theme.palette.primary.main}`,
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      fontFamily: theme.typography.fontFamily,
      fontWeight: 600,
      fontSize: 13,
      padding: '7px 12px',
      lineHeight: 1,
      transition: 'filter .15s',
      '&:hover': { filter: 'brightness(1.08)' }
    }
  }),
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
