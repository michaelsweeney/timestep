import React, { useState, useEffect } from 'react';
import {connect} from 'src/store';

import fs from 'fs';
import { remote } from 'electron';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Tooltip } from '@material-ui/core';

import { getSeries, getFileSummary } from 'src/sql';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      boxSizing: 'border-box'
    },
    button: {
      width: 115,
      whiteSpace: 'nowrap',
      transition: 'background-color 500ms'
    },
    buttonactive: {
      width: 115,
      whiteSpace: 'nowrap',
      backgroundColor: 'rgba(20, 20, 20, 0.5) !important',
      transition: 'background-color 5000ms'
    }
  },
  {
    name: 'load-session'
  }
);

const LoadSession = props => {
  const classes = useStyles();

  const [isActive, setIsActive] = useState('inactive');

  const handleFileChange = f => {
    fs.readFile(f[0], 'utf8', (err, data) => {
      if (err) throw err;
      let loadobj = JSON.parse(data);

      const { activeViewID, files, units } = loadobj.session;
      const { views } = loadobj;

      // reset views first
      props.actions.resetViews();
      props.actions.changeFiles(files);
      props.actions.changeUnits(units);

      Object.values(views).forEach(view => {
        let {
          viewID,
          timestepType,
          selectedSeries,
          selectedSeriesLabel,
          chartType
        } = view;

        props.actions.addView(viewID);
        props.actions.changeTimestepType(timestepType, viewID);
        props.actions.changeChartType(chartType, viewID);
        props.actions.changeSelectedSeries(selectedSeries, viewID);
        props.actions.changeSelectedSeriesLabel(selectedSeriesLabel, viewID);
      });
      props.actions.setActiveView(activeViewID);
      props.actions.setLoadingFromFile(true);

      // props.actions.incrementSession();
    });
  };

  const openDialog = () => {
    setTimeout(() => {
      remote.dialog
        .showOpenDialog({
          filters: [
            { name: 'Timestep Sessions', extensions: ['tss'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['openFile']
        })
        .then(d => handleFileChange(d.filePaths));
    }, 0);
  };

  const handleDragEnter = e => {
    let event = e as Event;
    event.stopPropagation();
    event.preventDefault();
  };
  const handleDragOver = e => {
    let event = e as Event;
    event.stopPropagation();
    event.preventDefault();
    setIsActive('active');
  };
  const handleDragLeave = e => {
    let event = e as Event;
    event.stopPropagation();
    event.preventDefault();
    setIsActive('inactive');
  };
  const handleDrop = e => {
    let files = Object.values(e.dataTransfer.files).map(f => f.path);

    // handle error alert for non-sql files
    let errflag = false;
    files.forEach(f => {
      if (f.split('.')[1] != 'tss') {
        errflag = true;
      }
    });

    if (!errflag) {
      handleFileChange(files);
      setIsActive('inactive');
    } else {
      alert('file loading error: only valid Timestep Session files allowed');
      setIsActive('inactive');
    }
  };

  return (
    <div className={classes.root}>
      <span
        className={isActive == 'active' ? classes.buttonactive : classes.button}
        onClick={openDialog}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        Load Session
      </span>
    </div>
  );
};

const mapStateToProps = state => {
  return {};
};

export default connect(mapStateToProps)(LoadSession);
