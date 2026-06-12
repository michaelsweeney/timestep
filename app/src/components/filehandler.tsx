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

  // .sql/.eso are loaded directly; .bnd/.mtr are companion files read
  // alongside the primary (the .bnd for unit resolution, the .mtr for meters
  // not embedded in the .eso). In the browser build they must be supplied
  // together so the engine can find them; on desktop they're read by sibling
  // path and any co-selected copies are simply ignored here.
  const loadFiles = files => {
    const primaries = files.filter(f => /\.(sql|eso)$/i.test(f));
    if (primaries.length === 0) {
      props.actions.setNotification(
        'File loading error: select at least one .sql or .eso file.'
      );
      return;
    }
    resolveFiles(primaries)
      .then(resolved => handleFileChange(resolved))
      .catch(err => {
        props.actions.setNotification(`File loading error: ${err.message}`);
      });
  };

  const openDialog = () => {
    window.api.dialog
      .openFiles({
        filters: [
          { name: 'EnergyPlus Outputs', extensions: ['sql', 'eso', 'bnd', 'mtr'] },
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
    // Register every dropped file (the browser build keys companions —
    // .bnd/.mtr — by name here so the engine can find them); loadFiles then
    // loads the .sql/.eso primaries and ignores the rest.
    const files = Object.values(e.dataTransfer.files).map(f =>
      window.api.getPathForFile(f as File)
    );
    setIsActive('inactive');

    const known = files.filter(f => /\.(sql|eso|bnd|mtr)$/i.test(f));
    if (known.length === 0) {
      props.actions.setNotification(
        'File loading error: drop .sql or .eso files (optionally with sibling .bnd/.mtr).'
      );
      return;
    }
    loadFiles(files);
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
