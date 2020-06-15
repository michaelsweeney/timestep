import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
const useStyles = makeStyles(
  {
    root: {
      textAlign: 'center',
      '& div': {
        textAlign: 'center'
      }
    }
  },
  { name: 'controls-container' }
);
const ControlsContainer = props => {
  const classes = useStyles();
  return <div className={classes.root + ' ' + props.tag}>{props.children}</div>;
};

export { ControlsContainer };
