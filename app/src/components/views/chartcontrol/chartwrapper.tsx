import React, { useState, useEffect, useRef } from 'react';
import { CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      overflow: 'hidden',
      display: 'inline-block',
      width: 'calc(100%)'
    },
    spinneractive: {
      visibility: 'visible',
      position: 'absolute',
      left: '50%',
      top: '30%',
      zIndex: 999
    },
    spinnerinactive: {
      position: 'absolute',
      left: '50%',
      top: '30%',
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

const ChartWrapper = props => {
  const classes = useStyles(props);

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

export { ChartWrapper };
