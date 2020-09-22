import React, { useEffect, useRef } from 'react';

import { connect } from 'src/store';
import ChartTypeControl from './charttypecontrol';

const MappedViews = props => {
  const { viewArray } = props;
  const container = useRef(null);

  const minwidth = 300;
  const minheight = 100;

  const calculateContainerDims = node => {
    return {
      width: Math.max(node.getBoundingClientRect()['width'] - 175, minwidth),
      height: Math.max(node.getBoundingClientRect()['height'] - 75, minheight)
    };
  };

  // get initial dims after mount
  useEffect(() => {
    let dims = calculateContainerDims(container.current);
    props.actions.setContainerDims(dims);
  }, []);

  // get dims on window resize
  useEffect(() => {
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        let dims = calculateContainerDims(container.current);
        props.actions.setContainerDims(dims);
      }, 0);
    }
    let resizeTimer;
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const mappedViews = Object.values(viewArray).map(id => {
    return <ChartTypeControl key={id} viewID={id} />;
  });
  return (
    <div
      style={{
        width: '100%',
        height: '100%'
      }}
      ref={container}
    >
      {mappedViews}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    viewArray: state.session.viewArray,
    containerDims: state.session.containerDims
  };
};

export default connect(mapStateToProps)(MappedViews);
