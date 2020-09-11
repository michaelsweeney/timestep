import React from 'react';

import TimeStepSelect from './timestepselect';
import ChartTypeSelector from './charttypeselector';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      display: 'block',
      borderBottom: '1px solid rgba(0,0,0,0.3)',
      boxSizing: 'border-box',
      marginLeft: 20,
      marginRight: 25,
      paddingTop: 10,
      paddingBottom: 10
    }
  },
  {
    name: 'view-header'
  }
);

const ViewHeader = props => {
  const classes = useStyles();

  const { viewID } = props;

  return (
    <div className={classes.root}>
      <ChartTypeSelector viewID={viewID} />
      <TimeStepSelect viewID={viewID} />
    </div>
  );
};

export default ViewHeader;
