import React, { useState, useEffect } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { ColorScaleSelect } from './colorscaleselect';
import { RangeSlider } from './rangeslider';
import { InputLabel, FormLabel, Checkbox, Button } from '@material-ui/core';

const useStyles = makeStyles(
  {
    root: {
      marginTop: 10,
      marginBottom: 10,
      padding: 10,
      width: 300
    },
    checkbox: {},
    formlabel: {
      marginBottom: 10,
      color: 'rgba(0, 0, 0, 0.54);'
    },
    checkboxcontainer: {},
    '& div': {
      display: 'inline-block'
    }
  },

  {
    name: 'color-control'
  }
);

const ColorControl = props => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.formlabel}>Color Options</div>
      <InputLabel>scale</InputLabel>
      <ColorScaleSelect colorScaleCallback={props.colorScaleCallback} />
      <div className={classes.checkboxcontainer}>
        <InputLabel>reversed</InputLabel>
        <Checkbox
          className={classes.checkbox}
          color="primary"
          disableRipple={true}
          onChange={props.reverseCallback}
        />
      </div>
      <InputLabel>domain</InputLabel>
      <RangeSlider
        defaultValue={props.defaultRange}
        rangeCallback={props.rangeCallback}
      ></RangeSlider>
      {/* <Button style={{ display: 'none' }}>x</Button>{' '} */}
      {/* ADDING A BLANK BUTTON AVOIDS MUI RESTYLING SIDEBAR BUTTONS. WHY ??*/}
    </div>
  );
};

export { ColorControl };
