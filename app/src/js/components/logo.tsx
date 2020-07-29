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
      fontSize: '40px'
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
      <Typography color="primary" variant="h2">
        <Typography className={classes.text} variant="span" color="primary">
          timest
        </Typography>
        <Typography className={classes.text} variant="span" color="secondary">
          ep
        </Typography>
      </Typography>
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
