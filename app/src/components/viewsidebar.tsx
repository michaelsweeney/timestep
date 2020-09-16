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
      width: 150,
      verticalAlign: 'top',
      overflow: 'hidden',
      whitespace: 'nowrap'
    },
    linebreak: {
      marginTop: 10,
      marginBottom: 20,
      paddingLeft: 10,
      paddingRight: 10,
      borderBottom: '1px solid rgba(0,0,0,0.3)',
      boxSizing: 'border-box'
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
      <div className={classes.linebreak} />
      <TimeStepSelect viewID={viewID} />
      <div className={classes.linebreak} />

      <UnitRadio />
    </div>
  );
};

export default ViewSidebar;
