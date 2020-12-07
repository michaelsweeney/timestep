import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import { connect } from 'src/store';

const useStyles = makeStyles(
  {
    root: {
      textAlign: 'right',
      position: 'absolute',
      bottom: 10,
      // left: 5,
      right: 30,
      color: 'rgba(0, 0, 0, 0.54)',
      fontWeight: 400,
      // backgroundColor: 'white',
      height: 25,
      width: 25
      // border: '1px solid black'
      // width: '75px',
      // padding: 5
    },
    inner: {}
  },
  {
    name: 'version'
  }
);

const Version = props => {
  const classes = useStyles();
  const { version } = props;

  return (
    <div className={classes.root}>
      <div className={classes.inner}>{version}</div>
    </div>
  );
};

const mappedState = state => {
  return {
    version: state.session.version
    // units: state.session.units
  };
};
export default connect(mappedState)(Version);
