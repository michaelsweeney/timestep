import React from 'react';
import { Radio, InputLabel } from '@material-ui/core';
import {connect} from 'src/store';
import { makeStyles } from '@material-ui/core/styles';

// SI/IP toggle. The "Units" heading is supplied by the sidebar section.
const useStyles = makeStyles(
  {
    root: {
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden'
    },
    radio: { padding: 7 },
    radioinput: { display: 'inline-block !important' }
  },
  {
    name: 'unit-radio'
  }
);

const UnitRadio = props => {
  const { units } = props;

  const classes = useStyles();

  const handleChange = () => {
    let newunits = units == 'ip' ? 'si' : 'ip';
    props.actions.changeUnits(newunits);
  };

  return (
    <div className={classes.root}>
      <InputLabel className={classes.radioinput}>SI</InputLabel>
      <Radio
        className={classes.radio}
        disableRipple={true}
        color="primary"
        checked={units === 'si'}
        onChange={handleChange}
        value="si"
        name="radio-button-demo"
        inputProps={{ 'aria-label': 'SI' }}
      />

      <Radio
        className={classes.radio}
        disableRipple={true}
        color="primary"
        checked={units === 'ip'}
        onChange={handleChange}
        value="ip"
        name="radio-button-demo"
        inputProps={{ 'aria-label': 'IP' }}
      />

      <InputLabel className={classes.radioinput}>IP</InputLabel>
    </div>
  );
};

const mappedState = state => {
  return {
    units: state.session.units
  };
};

export default connect(mappedState)(UnitRadio);
