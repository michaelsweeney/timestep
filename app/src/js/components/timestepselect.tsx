import React, { useState, useEffect } from 'react';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
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
  const classes = useStyles();
  const [value, setValue] = useState(DEFAULTCONFIG.defaultStep);

  const handleChange = e => {
    setValue(e.target.value);
    props.timeStepCallback(e.target.value);
  };
  return (
    <div className={classes.root}>
      <InputLabel id="label">Timestep</InputLabel>
      <Select onChange={handleChange} id="select" value={value}>
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
