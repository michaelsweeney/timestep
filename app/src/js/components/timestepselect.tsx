import React, { useState, useEffect } from 'react';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';

const TimeStepSelect = props => {
  const [value, setValue] = useState('Hourly');

  const handleChange = e => {
    setValue(e.target.value);
    props.timeStepCallback(e.target.value);
  };
  return (
    <div className="timestep-select">
      <InputLabel id="label">Timestep</InputLabel>
      <Select
        onChange={handleChange}
        id="select"
        value={value}
        // disableRipple={true}
      >
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
