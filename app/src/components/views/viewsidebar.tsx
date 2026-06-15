import React from 'react';

import TimeStepSelect from './timestepselect';
import ChartTypeSelector from './charttypeselector';
import UnitRadio from './unitradio';

import { makeStyles } from '@material-ui/core/styles';

// Flat dark sidebar for the focused pane, matching the conservative mockup:
// uppercase section headers ("CHART TYPE · FOCUSED PANE", "INTERVAL", "UNITS")
// over flat controls, with hairline dividers between sections.
const useStyles = makeStyles(
  {
    root: {
      boxSizing: 'border-box',
      borderRight: '1px solid var(--hairline)',
      background: 'var(--panel)',
      height: '100%',
      width: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    },
    section: { padding: '14px 14px 6px' },
    heading: {
      margin: '0 0 9px',
      fontFamily: 'var(--sans)',
      fontWeight: 600,
      fontSize: 10,
      lineHeight: 1,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--ink-faint)'
    },
    hr: {
      height: 1,
      background: 'var(--hairline)',
      margin: '8px 14px'
    }
  },
  { name: 'view-sidebar' }
);

const ViewSidebar = props => {
  const classes = useStyles();

  const { viewID } = props;

  return (
    <div className={classes.root}>
      <div className={classes.section}>
        <h4 className={classes.heading}>Chart type · focused pane</h4>
        <ChartTypeSelector viewID={viewID} />
      </div>
      <div className={classes.hr} />
      <div className={classes.section}>
        <h4 className={classes.heading}>Interval</h4>
        <TimeStepSelect viewID={viewID} />
      </div>
      <div className={classes.hr} />
      <div className={classes.section}>
        <h4 className={classes.heading}>Units</h4>
        <UnitRadio />
      </div>
    </div>
  );
};

export default ViewSidebar;
