import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      // cursor: 'pointer',
      transition: 'all 250ms !important'
    },
    text: {
      fontSize: '38px',
      fontWeight: '300'
    },
    left: {
      color: '#3f51b5'
    },
    right: {
      color: '#f50057'
    }
  },
  {
    name: 'logo'
  }
);

const Logo = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.text}>
        <span className={classes.left}>timest</span>
        <span className={classes.right}>ep</span>
      </div>
    </div>
  );
};

export default Logo;
