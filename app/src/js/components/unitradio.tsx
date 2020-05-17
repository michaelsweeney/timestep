import React, { useState, useEffect } from 'react';
import Radio from '@material-ui/core/Radio';

const UnitRadio = props => {
  const handleChange = () => {
    let newunits = selectedValue == 'ip' ? 'si' : 'ip';
    setSelectedValue(newunits);
    props.unitCallback(newunits);
  };
  const [selectedValue, setSelectedValue] = useState('si');

  return (
    <div className="unit-radio">
      <span>SI</span>
      <Radio
        disableRipple={true}
        color="primary"
        checked={selectedValue === 'si'}
        onChange={handleChange}
        value="si"
        name="radio-button-demo"
        inputProps={{ 'aria-label': 'SI' }}
      />
      <span>IP</span>
      <Radio
        disableRipple={true}
        color="primary"
        checked={selectedValue === 'ip'}
        onChange={handleChange}
        value="ip"
        name="radio-button-demo"
        inputProps={{ 'aria-label': 'IP' }}
      />
    </div>
  );
};
export { UnitRadio };
