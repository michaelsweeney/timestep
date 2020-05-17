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
      <Select onChange={handleChange} id="select" value={value}>
        <MenuItem value="HVAC Timestep">HVAC Timestep</MenuItem>
        <MenuItem value="Zone Timestep">Zone Timestep</MenuItem>
        <MenuItem value="Hourly">Hourly</MenuItem>
        <MenuItem value="Daily">Daily</MenuItem>
        <MenuItem value="Monthly">Monthly</MenuItem>
        <MenuItem value="Run Period">Run Period</MenuItem>
      </Select>
    </div>
  );
};
export { TimeStepSelect };
