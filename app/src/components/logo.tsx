import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles(
  {
    root: {
      // position: 'relative',
      // top: 10,
      // left: -80
      // paddingBottom: 0,
      // textAlign: 'left'
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

export { Logo };

// <svg
//   width="51"
//   height="12"
//   viewBox="0 0 51 12"
//   fill="none"
//   xmlns="http://www.w3.org/2000/svg"
// ></svg>;
