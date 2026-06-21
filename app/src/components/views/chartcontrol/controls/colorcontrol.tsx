import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { ColorScaleSelect } from './colorscaleselect';
import { RangeSlider } from './rangeslider';
import { useControlStyles } from './controlstyles';
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
  const tokens = useControlStyles();

  return (
    <div className={classes.root}>
      <div>
        <div className={classes.colorselectcontainer}>
          <InputLabel className={tokens.label} shrink>
            Colorscale
          </InputLabel>
          <ColorScaleSelect colorScaleCallback={props.colorScaleCallback} />
        </div>
        <div className={classes.checkboxcontainer}>
          <Checkbox
            className={tokens.checkbox}
            color="primary"
            disableRipple={true}
            onChange={props.reverseCallback}
          />
          <InputLabel className={tokens.label} shrink>
            Reversed
          </InputLabel>
        </div>
      </div>
      <div className={classes.colordomaincontainer}>
        <InputLabel className={tokens.label} shrink>
          Color Domain
        </InputLabel>
        <RangeSlider
          defaultValue={props.defaultRange}
          rangeCallback={props.rangeCallback}
        ></RangeSlider>
      </div>
    </div>
  );
};

export { ColorControl };
