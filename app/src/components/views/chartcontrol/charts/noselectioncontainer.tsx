import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
const useStyles = makeStyles(
  {
    inner: {
      textAlign: 'center',
      paddingTop: '20%',
      color: 'rgba(0,0,0,0.8) !important',
      boxSizing: 'border-box'
    },
    title: {
      fontSize: 24,
      marginBottom: 16
    },
    maintext: {
      fontSize: 16,
      marginBottom: 5
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
