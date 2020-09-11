import React from 'react';

import connect from '../store/connect';
import ChartTypeControl from './charttypecontrol';

const Views = props => {
  const { activeViewID, views } = props;

  const mappedViews = Object.values(views).map(view => {
    return (
      <ChartTypeControl
        viewActive={activeViewID == view.viewID ? true : false}
        key={view.viewID}
        viewID={view.viewID}
      />
    );
  });
  return mappedViews;
};

const mapStateToProps = state => {
  return {
    views: state.views,
    activeViewID: state.session.activeViewID
  };
};

export default connect(mapStateToProps)(Views);
