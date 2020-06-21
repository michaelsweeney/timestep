import React, { useState, useEffect } from 'react';

import { InputLabel } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {
    display: 'block'
  }
});

const CheckboxInput = props => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
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
