import React from 'react';

import TimeStepSelect from './timestepselect';
import ChartTypeSelector from './charttypeselector';
import UnitRadio from './unitradio';
import { InfoContainer } from './infocontainer';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      borderRight: '1px solid rgba(0,0,0,0.3)',
      boxSizing: 'border-box',
      height: '100%',
      margin: 10,
      padding: 10,
      width: 125
    }
  },
  {
    name: 'view-sidebar'
  }
);

const ViewSidebar = props => {
  const classes = useStyles();

  const { viewID } = props;

  return (
    <div className={classes.root}>
      <ChartTypeSelector viewID={viewID} />
      <TimeStepSelect viewID={viewID} />
    </div>
  );
};

export default ViewSidebar;
