import React, { useState, useEffect } from 'react';
import { formatInt } from './numformat';
import Typography from '@material-ui/core/Typography';
import {
  Radio,
  Select,
  Checkbox,
  Slider,
  Button,
  ButtonGroup,
  Input,
  InputLabel,
  FormControl

  // FormGroup
} from '@material-ui/core';

const RangeSlider = props => {
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
    <div style={{ width: '400px', display: 'inlineBlock' }}>
      <Typography id="discrete-slider-always" gutterBottom>
        {props.title}
      </Typography>
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
