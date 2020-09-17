import React from 'react';
import { Select, InputLabel, MenuItem } from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';

import connect from '../store/connect';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      textAlign: 'center',
      marginBottom: 10,
      width: '100%'
    },
    inputlabel: {
      textAlign: 'center',
      marginBottom: 10
    },
    select: {
      display: 'inline-block'
      // left: '5 !important'
    },
    selectwrapper: {
      display: 'block'
      //  paddingLeft: 15
    },
    icon: {
      // color: 'rgba(63, 81, 181, 1) !important'
    }
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
      <InputLabel className={classes.inputlabel} id="label">
        Interval
      </InputLabel>
      <div className={classes.selectwrapper}>
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
