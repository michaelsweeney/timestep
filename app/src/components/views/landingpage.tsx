import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      textAlign: 'center',
      marginTop: 200,
      marginBottom: 40,
      padding: 20,
      color: 'var(--ink)'
    },
    title: {
      fontSize: 40,
      marginBottom: 32,
      fontFamily: 'var(--sans)',
      fontWeight: 600,
      letterSpacing: '0.01em'
    },
    maintext: {
      fontSize: 21,
      marginBottom: 14,
      lineHeight: 1.6,
      color: 'var(--ink-dim)'
    },
    note: {
      fontSize: 15,
      marginTop: 38,
      color: 'var(--ink-faint)'
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

      <div className={classes.maintext}>No files loaded yet.</div>
      <div className={classes.maintext}>
        Open files from the "Files" menu, or drag them onto the window.
      </div>

      <div className={classes.maintext}>
        Already have an <strong>eplusout.sql</strong> (from
        "Output:SQLite" in your IDF)? Load it directly.
      </div>
      <div className={classes.maintext}>
        No .sql? Load the raw <strong>eplusout.eso</strong> instead — Timestep
        converts it for you, with no model re-run needed.
      </div>

      <div className={classes.note}>
        Your original output files are never modified — ESO conversions are
        cached separately.
      </div>
    </div>
  );
};

export { LandingPage };
