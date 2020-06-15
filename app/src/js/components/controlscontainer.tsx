import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
const useStyles = makeStyles(
  {
    root: {
      textAlign: 'center',
      '& div': {
        textAlign: 'center'
      },
      boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
      padding: 10
    }
  },
  { name: 'controls-container' }
);
const ControlsContainer = props => {
  const classes = useStyles();
  return <div className={classes.root + ' ' + props.tag}>{props.children}</div>;
};

export { ControlsContainer };
