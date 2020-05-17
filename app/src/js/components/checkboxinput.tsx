import React, { useState, useEffect } from 'react';

import { Checkbox, InputLabel } from '@material-ui/core';

const CheckboxInput = props => {
  return (
    <div style={{ display: 'inlineBlock' }} className="checkbox-container">
      <InputLabel className="checkbox-label">{props.title}</InputLabel>
      <input // bug here with material UI checkboxes...
        type="checkbox"
        // disableRipple={true}
        // color="primary"
        onChange={props.callback}
      ></input>
    </div>
  );
};

export { CheckboxInput };
