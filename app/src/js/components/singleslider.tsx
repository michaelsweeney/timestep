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

const SingleSlider = props => {
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
    <div style={{ width: '400px', display: 'inlineBlock' }}>
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
