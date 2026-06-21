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
      right: 30,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--mono)',
      fontSize: 11,
      fontWeight: 400,
      height: 25,
      width: 25
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
