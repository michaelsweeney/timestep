import React, { useState, useEffect } from 'react';
import Radio from '@material-ui/core/Radio';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      marginLeft: 20,
      marginRight: 20,
      marginTop: 10
    },
    radio: { padding: 12 },
    '& span': {
      padding: 12
    }
  },

  {
    name: 'unit-radio'
  }
);

const UnitRadio = props => {
  const handleChange = () => {
    let newunits = selectedValue == 'ip' ? 'si' : 'ip';
    setSelectedValue(newunits);
    props.unitCallback(newunits);
  };
  const [selectedValue, setSelectedValue] = useState('si');
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <span>SI</span>
      <Radio
        className={classes.radio}
        disableRipple={true}
        color="primary"
        checked={selectedValue === 'si'}
        onChange={handleChange}
        value="si"
        name="radio-button-demo"
        inputProps={{ 'aria-label': 'SI' }}
      />
      <Radio
        className={classes.radio}
        disableRipple={true}
        color="primary"
        checked={selectedValue === 'ip'}
        onChange={handleChange}
        value="ip"
        name="radio-button-demo"
        inputProps={{ 'aria-label': 'IP' }}
      />
      <span>IP</span>
    </div>
  );
};
export { UnitRadio };
