import React, { useState, useEffect, useRef } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
      overflow: 'hidden'
    },
    spinneractive: {
      visibility: 'visible',
      position: 'absolute',
      left: '40%',
      top: '25%',
      zIndex: 999
    },
    spinnerinactive: {
      position: 'absolute',
      left: '40%',
      top: '25%',
      visibility: 'hidden',
      zIndex: 999
    },
    chartactive: {
      opacity: 1.0,
      '& .tooltip': {
        visibility: 'visible'
      }
    },
    chartinactive: {
      opacity: 0.25,
      '& .tooltip': {
        visibility: 'hidden'
      }
    }
  },
  {
    name: 'view-styles'
  }
);

const ViewWrapper = props => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <CircularProgress
        className={
          props.isLoading ? classes.spinneractive : classes.spinnerinactive
        }
        size={100}
      />
      <div
        className={
          props.isLoading ? classes.chartinactive : classes.chartactive
        }
        ref={props.plotContainer}
      >
        {props.children}
      </div>
    </div>
  );
};

export { ViewWrapper };
