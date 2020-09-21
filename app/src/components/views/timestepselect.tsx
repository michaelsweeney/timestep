import React from 'react';
import { Select, InputLabel, MenuItem } from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';

import { connect } from 'src/store';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      marginBottom: 10,
      width: '100%',
      overflow: 'hidden',
      whitespace: 'nowrap'
    },
    inputlabel: {
      textAlign: 'center',
      marginBottom: 10
    },
    select: {
      display: 'inline-block',
      textAlign: 'left'
    },
    selectwrapper: {
      display: 'block',
      textAlign: 'center'
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
