import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

// Theme-aware chart container, now driven by the CSS token set instead of the
// MUI palette. The d3 axes set stroke via presentation attributes (lower
// specificity than CSS) and series marks via inline .style('fill') (higher
// specificity), so recoloring .axis-text / .domain / .tick line here recolors
// the axes + panel without touching the data encodings. Because these are
// var(--...) references, the chart re-themes the instant data-theme flips on
// <html> — no React re-render needed.
const useStyles = makeStyles(
  {
    root: {
      height: '100%',
      boxSizing: 'border-box',
      backgroundColor: 'var(--panel-2)',
      color: 'var(--ink)',
      '& .axis-text': { fill: 'var(--ink-dim)' },
      '& .domain, & .tick line, & .x-line': { stroke: 'var(--hairline-2)' },
      '& .tick text': { fill: 'var(--ink-dim)' },
      '& path': { shapeRendering: 'geometricPrecision' },
      '& .series-line, .marker-circle': { pointerEvents: 'none' },
      '& .tooltip': {
        cursor: 'default',
        pointerEvents: 'none',
        position: 'absolute',
        color: 'var(--ink)',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--hairline-2)',
        fontFamily: 'var(--mono)',
        fontSize: 12,
        transition: 'left 100ms, top 100ms',
        borderRadius: 4,
        padding: 10,
        '& .tooltip-time': {
          marginBottom: 10,
          textAlign: 'center'
        }
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
