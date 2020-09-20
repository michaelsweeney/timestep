import React, { useState, useEffect } from 'react';

import { makeStyles } from '@material-ui/core/styles';

import { RangeSlider } from './rangeslider';
import { SingleSlider } from './singleslider';

import { InputLabel } from '@material-ui/core';

const useStyles = makeStyles(
  {
    root: {
      marginLeft: 30,
      marginTop: 10,
      marginBottom: 10,
      width: 300
    }
  },

  {
    name: 'bin-control'
  }
);

const BinControl = props => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <InputLabel>Bin Range</InputLabel>
      <RangeSlider
        defaultValue={props.defaultRange}
        rangeCallback={props.rangeCallback}
      ></RangeSlider>
      <InputLabel>{'Bins: ' + props.numBins}</InputLabel>
      <SingleSlider
        min={0}
        max={50}
        defaultValue={10}
        sliderCallback={props.binCallback}
      ></SingleSlider>
    </div>
  );
};

export { BinControl };
