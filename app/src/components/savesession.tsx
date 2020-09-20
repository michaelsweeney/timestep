import React, { useState, useEffect } from 'react';
import {connect, store} from 'src/store';

import fs from 'fs';
import { remote } from 'electron';
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

  const handleSave = () => {
    const { session, views } = store.getState();

    let formatstr = JSON.stringify({ session, views });

    let options = {
      title: 'Save Session',
      buttonLabel: 'Save Session',
      filters: [{ name: 'tss', extensions: ['tss'] }]
    };
    remote.dialog.showSaveDialog(formatstr, options).then(f => {
      let path = f.filePath;
      if (f.filePath.split('.')[1] != 'tss') {
        path = path + '.tss';
      }
      fs.writeFile(path, formatstr, err => {
        if (err) console.log(err);
      });
    });
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
