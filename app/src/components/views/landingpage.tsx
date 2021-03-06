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

const LandingPage = props => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <div className={classes.title}>
        Timestep: EnergyPlus timeseries visualization tool
      </div>

      <div className={classes.maintext}>No Files are currently loaded.</div>
      <div className={classes.maintext}>
        Select "LOAD FILES" from the "Files" menu to load timeseries results.
      </div>
      <div className={classes.maintext}>
        Make sure that "Output:SQLite:SimpleAndTabular" has been included in
        your IDF file.
      </div>
    </div>
  );
};

export { LandingPage };
