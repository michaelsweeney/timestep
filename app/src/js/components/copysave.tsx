import React, { useState, useEffect } from 'react';
import { clipboard } from 'electron';
import fs from 'fs';
import { remote } from 'electron';

import { timeFormat } from 'd3';
import AssignmentIcon from '@material-ui/icons/Assignment';

import SaveAltIcon from '@material-ui/icons/SaveAlt';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Tooltip } from '@material-ui/core';

const useStyles = makeStyles(
  {
    root: {}
  },
  {
    name: 'copy-save-container'
  }
);

const CopySave = props => {
  const classes = useStyles();

  const { units, files, array, arraytype } = props;

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';
  const ismulti = files.length > 1 ? true : false;
  const titlekey = ismulti ? 'name_multi' : 'name_single';
  const timeparsestr = '%d %b %H:%M';

  const handleFormat = () => {
    let formatted;
    if (arraytype == 'single') {
      formatted = reformatSingleObject(array);
    }
    if (arraytype == 'scatter') {
      formatted = reformatMultiObject(array);
    }
    if (arraytype == 'multi') {
      formatted = reformatMultiObject(array);
    }
    let formatstr = objectArrayToCsvString(formatted);
    return formatstr;
  };

  const handleCopy = () => {
    checkMultipleFiles();

    let formatstr = handleFormat();

    clipboard.writeText(formatstr);
  };
  const handleSave = () => {
    checkMultipleFiles();
    let formatstr = handleFormat();

    let options = {
      title: 'Save to CSV',
      buttonLabel: 'Save to CSV',
      filters: [{ name: 'csv', extensions: ['csv'] }]
    };
    remote.dialog.showSaveDialog(formatstr, options).then(f => {
      let path = f.filePath;
      if (f.filePath.split('.')[1] != 'csv') {
        path = path + '.csv';
      }
      fs.writeFile(path, formatstr, err => {
        if (err) console.log(err);
      });
    });
  };

  const checkMultipleFiles = () => {
    console.log(files.length);
    if (files.length > 1) {
      alert(
        'Copy/Paste operations are currently unavailable when multiple files have been loaded'
      );
    }
  };

  function reformatMultiObject(objarray) {
    // multiple series, single file i.e. guaranteed single timestep
    let formatarray = [['Time']];

    objarray.forEach(arr => {
      // push column names
      formatarray[0].push(arr[0][titlekey]);
    });

    // use time sequence from first series
    if (objarray[0]) {
      objarray[0].forEach((o, i) => {
        let time = timeFormat(timeparsestr)(o['time']);
        let vals = objarray.map(arr => arr[i][valkey]);
        formatarray.push([time, ...vals]);
      });
    }
    return formatarray;
  }

  function reformatSingleObject(objarray) {
    // single series, single file
    let formatarray = [
      ['Time', objarray[0] ? objarray[0][titlekey].replace(',', '_') : '']
    ];
    objarray.forEach(d => {
      formatarray.push([timeFormat(timeparsestr)(d['time']), d[valkey]]);
    });
    return formatarray;
  }

  function objectArrayToCsvString(objarray) {
    return objarray.map(obj => Object.values(obj).join(',')).join('\n');
  }

  return (
    <div className={classes.root}>
      <Tooltip
        disableFocusListener
        disableTouchListener
        title="Copy to Clipboard"
      >
        <Button
          variant="outlined"
          color="primary"
          onClick={handleCopy}
          disableRipple={true}
        >
          <AssignmentIcon />
        </Button>
      </Tooltip>
      <Tooltip disableFocusListener disableTouchListener title="Save to CSV">
        <Button
          variant="outlined"
          color="primary"
          onClick={handleSave}
          disableRipple={true}
        >
          <SaveAltIcon />
        </Button>
      </Tooltip>
    </div>
  );
};
export { CopySave };
