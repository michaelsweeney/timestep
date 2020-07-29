import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      height: '100%',
      boxSizing: 'border-box',
      '& path': {
        shapeRendering: 'geometricPrecision'
      },
      '& .series-line, .marker-circle': {
        pointerEvents: 'none'
      },
      '& .tooltip': {
        cursor: 'default',
        pointerEvents: 'none',
        position: 'absolute',
        color: 'white',
        backgroundColor: 'rgb(43, 42, 42)',
        transition: 'left 100ms, top 100ms',
        borderRadius: 5,
        padding: 10
      }
    }
  },
  { name: `d3-container` }
);

const D3Container = props => {
  const classes = useStyles({ tag: props.tag });
  return <div className={classes.root} ref={props.refcontainer}></div>;
};

export { D3Container };
