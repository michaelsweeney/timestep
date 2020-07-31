import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      textAlign: 'center',
      marginTop: 200,
      marginBottom: 40,
      padding: 20,
      color: 'rgba(0,0,0,0.8)'
    },
    title: {
      fontSize: 24,
      marginBottom: 16
    },
    maintext: {
      fontSize: 16,
      marginBottom: 5
    }
  },
  {
    name: 'landing-page'
  }
);

const EmptyContainer = props => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <div className={classes.title}>No Series Data Loaded</div>
      <div className={classes.maintext}>Select series below</div>
    </div>
  );
};
export { EmptyContainer };
