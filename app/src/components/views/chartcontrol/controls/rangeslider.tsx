import React, { useState, useEffect } from 'react';
import { formatInt } from 'src/format';
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

const RangeSlider = props => {
  const classes = useStyles();
  const [value, setValue] = useState([]);

  let min = props.defaultValue[0];
  let max = props.defaultValue[1];
  // avoid duplicate react keys when initializing state
  if (min == max) {
    max += 1;
  }

  const handleChange = (event: any, newValue: number | number[]) => {
    setValue(newValue as number[]);
  };

  const handleCallback = () => {
    props.rangeCallback(value);
  };

  useEffect(() => {
    setValue(props.defaultValue);
  }, [min, max]);

  const marks = [
    { value: min, label: formatInt(min) },
    { value: max, label: formatInt(max) }
  ];

  return (
    <div className={classes.root}>
      <Slider
        min={min}
        max={max}
        marks={marks}
        valueLabelDisplay={'auto'}
        onChange={handleChange}
        onMouseUp={handleCallback}
        value={value}
      />
    </div>
  );
};

export { RangeSlider };
