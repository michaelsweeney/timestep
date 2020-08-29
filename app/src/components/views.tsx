import React from 'react';

import connect from '../connect';
import ViewTypeControl from './viewtypecontrol';

const Views = props => {
  const { session, views } = props;
  const { activeViewID } = session;

  const mappedViews = Object.values(views).map(view => {
    return (
      <ViewTypeControl
        style={{
          display: () => (activeViewID == view.viewID ? 'inline-block' : 'none')
        }}
        key={view.viewID}
        viewID={view.viewID}
      />
    );
  });
  return mappedViews;
};

const mapStateToProps = state => {
  return {
    ...state
  };
};

export default connect(mapStateToProps)(Views);
