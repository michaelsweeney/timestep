import React, { useState, useEffect } from 'react';
import { connect, store } from 'src/store';

import { makeStyles } from '@material-ui/core/styles';
import { Button, Tooltip } from '@material-ui/core';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block'
    }
  },
  {
    name: 'save-session'
  }
);

const SaveSession = props => {
  const classes = useStyles();

  const handleSave = async () => {
    const { session, views } = store.getState();

    let formatstr = JSON.stringify({ session, views });

    let options = {
      title: 'Save Session',
      buttonLabel: 'Save Session',
      filters: [{ name: 'tss', extensions: ['tss'] }]
    };
    const f = await window.api.dialog.saveFile(options);
    if (f.canceled || !f.filePath) return;
    let path = f.filePath;
    if (path.split('.')[1] != 'tss') {
      path = path + '.tss';
    }
    try {
      await window.api.fs.writeText(path, formatstr);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className={classes.root}>
      <span variant="outlined" color="primary" onClick={handleSave}>
        Save Session
      </span>
    </div>
  );
};

export default SaveSession;
