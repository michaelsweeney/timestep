import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
const useStyles = makeStyles(
  {
    inner: {
      textAlign: 'center',
      paddingTop: '20%',
      color: 'var(--ink-dim)',
      boxSizing: 'border-box'
    },
    title: {
      fontSize: 20,
      marginBottom: 10,
      fontFamily: 'var(--sans)',
      fontWeight: 600,
      color: 'var(--ink)'
    },
    maintext: {
      fontSize: 14,
      marginBottom: 5,
      color: 'var(--ink-dim)'
    },
    outer: {
      height: props => props.height,
      boxSizing: 'border-box'
    }
  },
  { name: `empty-container` }
);

const NoSelectionContainer = props => {
  const { width, height } = props.plotdims;
  const classes = useStyles({ width: width, height: height });

  return (
    <div className={classes.outer}>
      <div className={classes.inner}>
        <div className={classes.title}>No data selected</div>

        <div className={classes.maintext}>
          Select series info from below to view
        </div>
      </div>
    </div>
  );
};

export { NoSelectionContainer };
