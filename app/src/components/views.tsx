import React, { useEffect, useRef } from 'react';

import connect from '../store/connect';
import ChartTypeControl from './charttypecontrol';

const Views = props => {
  const { activeViewID, views, containerDims } = props;
  const container = useRef(null);

  const minwidth = 300;
  const minheight = 100;

  const getContainerDims = node => {
    return {
      width: Math.max(node.getBoundingClientRect()['width'] - 175, minwidth),
      height: Math.max(node.getBoundingClientRect()['height'] - 75, minheight)
    };
  };

  // get initial dims after mount
  useEffect(() => {
    let dims = getContainerDims(container.current);
    props.actions.setContainerDims(dims);
  }, [activeViewID]);

  // get dims on window resize
  useEffect(() => {
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        let dims = getContainerDims(container.current);
        props.actions.setContainerDims(dims);
      }, 250);
    }
    let resizeTimer;
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const mappedViews = Object.values(views).map(view => {
    return (
      <ChartTypeControl
        key={view.viewID}
        viewActive={activeViewID == view.viewID ? true : false}
        viewID={view.viewID}
      />
    );
  });
  return <div ref={container}>{mappedViews}</div>;
};

const mapStateToProps = state => {
  return {
    views: state.views,
    containerDims: state.session.containerDims,
    activeViewID: state.session.activeViewID
  };
};

export default connect(mapStateToProps)(Views);
