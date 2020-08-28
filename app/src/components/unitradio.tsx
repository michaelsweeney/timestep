import React from 'react';
import { Radio, InputLabel } from '@material-ui/core';
import connect from '../connect';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      marginLeft: 20,
      marginRight: 20,
      marginTop: 20,
      marginBottom: 10
    },
    radio: { padding: 6 }
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
      <InputLabel>Units</InputLabel>
      <span>SI</span>
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
      <span>IP</span>
    </div>
  );
};

const mappedState = state => {
  return {
    files: state.session.files,
    units: state.session.units
  };
};

export default connect(mappedState)(UnitRadio);
