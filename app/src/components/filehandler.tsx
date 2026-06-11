import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'src/store';

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
      transition: 'background-color 500ms'
    }
  },
  { name: 'file-handler' }
);

const FileHandler = props => {
  const classes = useStyles();

  const [isActive, setIsActive] = useState('inactive');

  const handleFileChange = f => {
    props.actions.resetViews();
    props.actions.addView(1);
    props.actions.setActiveView(1);
    props.actions.changeFiles(f);
  };

  // .eso files are converted to SQLite in the main process (cached on
  // path+size+mtime, so repeat opens are instant) and swapped for the
  // resulting .sql path; .sql files pass through untouched.
  const resolveFiles = async files => {
    const resolved = [];
    for (const f of files) {
      if (/\.eso$/i.test(f)) {
        props.actions.setNotification(`Converting ${f} to SQLite...`);
        resolved.push(await window.api.eso.convertToSql(f));
      } else {
        resolved.push(f);
      }
    }
    return resolved;
  };

  const loadFiles = files => {
    resolveFiles(files)
      .then(resolved => handleFileChange(resolved))
      .catch(err => {
        props.actions.setNotification(`File loading error: ${err.message}`);
      });
  };

  const openDialog = () => {
    window.api.dialog
      .openFiles({
        filters: [
          { name: 'EnergyPlus Outputs', extensions: ['sql', 'eso'] },
          { name: 'EP SQLite Files', extensions: ['sql'] },
          { name: 'EP ESO Files', extensions: ['eso'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      })
      .then(d => {
        if (!d.canceled) loadFiles(d.filePaths);
      });
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
    let files = Object.values(e.dataTransfer.files).map(f =>
      window.api.getPathForFile(f as File)
    );

    // handle error alert for non-sql/eso files
    const errflag = files.some(f => !/\.(sql|eso)$/i.test(f));

    if (!errflag) {
      loadFiles(files);
      setIsActive('inactive');
    } else {
      props.actions.setNotification(
        'File loading error: only .sql or .eso files allowed.'
      );
      setIsActive('inactive');
    }
  };
  return (
    <div className={classes.root}>
      <span
        variant="contained"
        color="primary"
        className={isActive == 'active' ? classes.buttonactive : classes.button}
        onClick={openDialog}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        Load Files
      </span>
    </div>
  );
};

const mappedState = state => {
  return {
    // files: state.session.files,
    // units: state.session.units
  };
};

export default connect(mappedState)(FileHandler);
