import React, { useState, useEffect } from 'react';

import { makeStyles } from '@material-ui/core/styles';

import { RangeSlider } from './rangeslider';
import { SingleSlider } from './singleslider';
import { useControlStyles } from './controlstyles';

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
  const tokens = useControlStyles();

  return (
    <div className={classes.root}>
      <InputLabel className={tokens.label} shrink>
        {'# Bins: ' + props.numBins}
      </InputLabel>
      <SingleSlider
        min={0}
        max={50}
        defaultValue={10}
        sliderCallback={props.binCallback}
      />
      <InputLabel className={tokens.label} shrink>
        Bin Range
      </InputLabel>
      <RangeSlider
        defaultValue={props.defaultRange}
        rangeCallback={props.rangeCallback}
      />
    </div>
  );
};

export { BinControl };
