import React, { useState, useEffect } from 'react';
import { Slider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

// Flat, de-Materialized Slider matching rangeslider: token rail/track, square
// accent thumb, mono value labels.
const useStyles = makeStyles(
  {
    root: {
      width: 300,
      display: 'block'
    },
    slider: {
      color: 'var(--accent)',
      height: 3,
      padding: '13px 0',
      '& .MuiSlider-rail': { backgroundColor: 'var(--track)', opacity: 1, height: 3 },
      '& .MuiSlider-track': { backgroundColor: 'var(--accent)', height: 3 },
      '& .MuiSlider-thumb': {
        width: 12,
        height: 12,
        borderRadius: 2,
        backgroundColor: 'var(--accent)',
        '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 6px rgba(91,158,252,0.16)' }
      },
      '& .MuiSlider-markLabel, & .MuiSlider-valueLabel': {
        fontFamily: 'var(--mono)',
        color: 'var(--ink-dim)'
      },
      '& .MuiSlider-mark': { backgroundColor: 'var(--hairline-2)' }
    }
  },
  { name: 'single-slider' }
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
      <Slider
        className={classes.slider}
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
