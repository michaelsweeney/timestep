import React from 'react';

import { connect } from 'src/store';
import PaneFrame from './paneframe';

// Lays the views out as side-by-side panes (a temporary equal flex row; the
// resizable/collapsible splitter shell lands in a later phase). Each pane
// self-measures via PaneFrame. With a single view this is one full-width pane —
// the same as before. Sizing is now per-pane, so the old global containerDims
// measurement/dispatch is gone.
const MappedViews = props => {
  const { viewArray } = props;
  const multiPane = viewArray.length > 1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'row'
      }}
    >
      {viewArray.map(id => (
        <PaneFrame key={id} viewID={id} multiPane={multiPane} />
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
