import React, { useState, useEffect } from 'react';
import { formatInt } from './numformat';
import Typography from '@material-ui/core/Typography';
import { Slider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      width: 300,
      display: 'block'
    }
  },
  { name: 'range-slider' }
);

const SingleSlider = props => {
  const classes = useStyles();

  const [value, setValue] = useState(0);

  let defaultval = props.defaultValue;

  const handleChange = (event: any, newValue: number | number[]) => {
    setValue(newValue as number[]);
  };

  const handleCallback = () => {
    props.sliderCallback(value);
  };

  useEffect(() => {
    setValue(defaultval);
  }, [defaultval]);

  return (
    <div className={classes.root}>
      <Typography id="discrete-slider-always" gutterBottom>
        {props.title}
      </Typography>
      <Slider
        max={props.max}
        min={props.min}
        valueLabelDisplay={'auto'}
        onChange={handleChange}
        onMouseUp={handleCallback}
        value={value}
      />
    </div>
  );
};

export { SingleSlider };
