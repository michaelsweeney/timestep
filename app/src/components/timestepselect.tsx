import React, { useState, useEffect } from 'react';
import { Select, InputLabel, MenuItem } from '@material-ui/core';

import { DEFAULTCONFIG } from '../defaultconfig';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      display: 'inlineBlock',
      margin: 10
    }
  },
  {
    name: 'timestep-select'
  }
);

const TimeStepSelect = props => {
  const { step } = props;

  const classes = useStyles();
  const handleChange = e => {
    let newvalue = e.target.value;
    props.timestepTypeCallback(newvalue);
  };
  return (
    <div className={classes.root}>
      <InputLabel id="label">Interval</InputLabel>
      <Select onChange={handleChange} id="select" value={step}>
        <MenuItem disableRipple={true} value="HVAC Timestep">
          HVAC Timestep
        </MenuItem>
        <MenuItem disableRipple={true} value="Zone Timestep">
          Zone Timestep
        </MenuItem>
        <MenuItem disableRipple={true} value="Hourly">
          Hourly
        </MenuItem>
        <MenuItem disableRipple={true} value="Daily">
          Daily
        </MenuItem>
        <MenuItem disableRipple={true} value="Monthly">
          Monthly
        </MenuItem>
        <MenuItem disableRipple={true} value="Run Period">
          Run Period
        </MenuItem>
      </Select>
    </div>
  );
};

export { TimeStepSelect };
