import React, { useState, Children, useRef } from 'react';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {}
});

const ControlsContent = props => {
  const classes = useStyles();
  const inputEl = useRef(null);
  return (
    <div className={classes.root} ref={inputEl}>
      {props.children}
    </div>
  );
};

export { ControlsContent };
