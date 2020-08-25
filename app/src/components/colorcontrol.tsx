import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { ColorScaleSelect } from './colorscaleselect';
import { RangeSlider } from './rangeslider';
import { InputLabel, Checkbox } from '@material-ui/core';

const useStyles = makeStyles(
  {
    root: {
      paddingLeft: 25
    },

    checkboxcontainer: {
      position: 'relative',
      top: 5,
      left: 10,
      display: 'inline-block',
      '& label': {
        display: 'inline-block',
        position: 'relative'
      }
    },
    colorselectcontainer: {
      // marginTop: 10,
      display: 'inline-block'
    },
    colordomaincontainer: {
      marginTop: 15
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
      <div>
        <div className={classes.colorselectcontainer}>
          <InputLabel>Colorscale</InputLabel>
          <ColorScaleSelect colorScaleCallback={props.colorScaleCallback} />
        </div>
        <div className={classes.checkboxcontainer}>
          <Checkbox
            className={classes.checkbox}
            color="primary"
            disableRipple={true}
            onChange={props.reverseCallback}
          />
          <InputLabel>Reversed</InputLabel>
        </div>
      </div>
      <div className={classes.colordomaincontainer}>
        <InputLabel>Color Domain</InputLabel>
        <RangeSlider
          defaultValue={props.defaultRange}
          rangeCallback={props.rangeCallback}
        ></RangeSlider>
      </div>
    </div>
  );
};

export { ColorControl };
