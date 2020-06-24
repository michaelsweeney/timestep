import React, { useState, useEffect } from 'react';
import { clipboard } from 'electron';
import fs from 'fs';
import { remote } from 'electron';
import AssignmentIcon from '@material-ui/icons/Assignment';
import SaveAltIcon from '@material-ui/icons/SaveAlt';

import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';

const useStyles = makeStyles(
  {
    root: {}
  },
  {
    name: 'copy-save-container'
  }
);

function objectArrayToCsvString(objarray) {
  return objarray.map(obj => Object.values(obj).join(',')).join('\n');
}

const CopySave = props => {
  const classes = useStyles();
  const formatted = objectArrayToCsvString(props.obj);

  const handleCopy = () => {
    console.log(formatted);
    clipboard.writeText(formatted);
  };
  const handleSave = () => {
    let options = {
      title: 'Save to CSV',
      buttonLabel: 'Save to CSV',
      filters: [{ name: 'csv', extensions: ['csv'] }]
    };
    remote.dialog.showSaveDialog(formatted, options).then(f => {
      let path = f.filePath;
      if (f.filePath.split('.')[1] != 'csv') {
        path = path + '.csv';
      }
      fs.writeFile(path, formatted, err => {
        if (err) console.log(err);
      });
    });
  };

  return (
    <div className={classes.root}>
      <Button variant="outlined" color="primary" onClick={handleCopy}>
        <AssignmentIcon />
      </Button>
      <Button variant="outlined" color="primary" onClick={handleSave}>
        <SaveAltIcon />
      </Button>
    </div>
  );
};
export { CopySave };
