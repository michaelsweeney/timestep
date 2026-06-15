import React from 'react';

import { connect } from 'src/store';
import { makeStyles } from '@material-ui/core/styles';
import PaneFrame from './paneframe';
import ViewSidebar from './viewsidebar';

const SIDEBAR_W = 196;

// Workspace = [ one shared sidebar (drives the FOCUSED pane) | tiled panes ].
// The sidebar is keyed to activeViewID, matching the conservative mockup (one
// sidebar, not one per pane). Each pane self-measures via PaneFrame; with a
// single view this is one full-width pane.
const useStyles = makeStyles(
  theme => ({
    root: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'row'
    },
    sidebar: {
      flex: 'none',
      width: SIDEBAR_W,
      height: '100%'
    },
    panes: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'row'
    }
  }),
  { name: 'workspace' }
);

const MappedViews = props => {
  const classes = useStyles();
  const { viewArray, activeViewID, hasFiles } = props;
  const multiPane = viewArray.length > 1;

  return (
    <div className={classes.root}>
      {hasFiles ? (
        <div className={classes.sidebar}>
          <ViewSidebar viewID={activeViewID} />
        </div>
      ) : null}
      <div className={classes.panes}>
        {viewArray.map((id, i) => (
          <PaneFrame
            key={id}
            viewID={id}
            paneIndex={i}
            multiPane={multiPane}
          />
        ))}
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  return {
    viewArray: state.session.viewArray,
    activeViewID: state.session.activeViewID,
    hasFiles: state.session.files.length > 0
  };
};

export default connect(mapStateToProps)(MappedViews);
