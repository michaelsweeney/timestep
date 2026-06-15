import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  theme => {
    const dark = theme.palette.type === 'dark';
    // Axis lines/text follow the theme. D3 axes set stroke via a presentation
    // attribute (lower specificity than CSS), and series-colored text/marks use
    // inline `.style('fill')` (higher specificity), so this recolors the axes
    // and the panel without touching the data encodings.
    const axis = dark ? '#cfcfcf' : 'rgba(0,0,0,0.75)';
    return {
      root: {
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: dark ? '#2b2a2a' : '#ffffff',
        color: axis,
        '& .axis-text': { fill: axis },
        '& .domain, & .tick line, & .x-line': { stroke: axis },
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
        padding: 10,
        '& .tooltip-time': {
          marginBottom: 10,
          textAlign: 'center'
        }
      }
      }
    };
  },
  { name: `d3-container` }
);

const D3Container = props => {
  const classes = useStyles({ tag: props.tag });
  return <div className={classes.root} ref={props.refcontainer}></div>;
};

export { D3Container };
