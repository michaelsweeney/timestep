import React from 'react';
import { Select, InputLabel, MenuItem } from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';

import connect from '../connect';

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
  const tempViewID = 1;

  const { timestepType } = props.views[tempViewID];

  const classes = useStyles();
  const handleChange = v => {
    props.actions.changeTimestepType(v.target.value, tempViewID);
  };
  return (
    <div className={classes.root}>
      <InputLabel id="label">Interval</InputLabel>
      <Select onChange={handleChange} id="select" value={timestepType}>
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

const mappedState = state => {
  return {
    views: state.views
  };
};

export default connect(mappedState)(TimeStepSelect);
