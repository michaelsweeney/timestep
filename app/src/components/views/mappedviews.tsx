import React from 'react';

import { connect } from 'src/store';
import { makeStyles } from '@material-ui/core/styles';
import PaneFrame from './paneframe';

// Workspace = the tiled PaneFrame row, full width. Each pane is self-contained:
// chart-type + interval live in its own pane header, series/options/export in
// its own bottom strip. (The shared left sidebar was removed — units, the only
// global control, moved to the topbar.) Each pane self-measures via PaneFrame;
// with a single view this is one full-width pane.
const useStyles = makeStyles(
  {
    root: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'row'
    }
  },
  { name: 'workspace' }
);

const MappedViews = props => {
  const classes = useStyles();
  const { viewArray } = props;
  const multiPane = viewArray.length > 1;

  return (
    <div className={classes.root}>
      {viewArray.map((id, i) => (
        <PaneFrame key={id} viewID={id} paneIndex={i} multiPane={multiPane} />
      ))}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    viewArray: state.session.viewArray
  };
};

export default connect(mapStateToProps)(MappedViews);
