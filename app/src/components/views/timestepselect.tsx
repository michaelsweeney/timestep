import React from 'react';
import { Select, MenuItem } from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';

import { connect } from 'src/store';

// Interval picker. The "Interval" heading is supplied by the sidebar section,
// so this renders just a full-width flat Select.
const useStyles = makeStyles(
  {
    root: {
      width: '100%',
      overflow: 'hidden'
    },
    select: {
      display: 'block',
      width: '100%',
      textAlign: 'left'
    },
    icon: {}
  },
  {
    name: 'timestep-select'
  }
);

const TimeStepSelect = props => {
  const { type } = props;
  const { viewID } = props;

  const classes = useStyles();
  const handleChange = v => {
    props.actions.changeTimestepType(v.target.value, viewID);
  };
  return (
    <div className={classes.root}>
      <Select
        inputProps={{
          classes: {
            icon: classes.icon
          }
        }}
        className={classes.select}
        onChange={handleChange}
        id="select"
        value={type}
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

const mappedState = (state, ownProps) => {
  const { viewID } = ownProps;
  return {
    type: state.views[viewID].timestepType
  };
};

export default connect(mappedState)(TimeStepSelect);
