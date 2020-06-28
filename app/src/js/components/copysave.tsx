import React, { useState, useEffect } from 'react';
import { clipboard } from 'electron';
import fs from 'fs';
import { remote } from 'electron';
import AssignmentIcon from '@material-ui/icons/Assignment';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import { timeFormat } from 'd3';
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

const CopySave = props => {
  const classes = useStyles();

  const valkey = props.units == 'ip' ? 'value_ip' : 'value_si';
  const ismulti = props.files.length > 1 ? true : false;
  const titlekey = ismulti ? 'name_multi' : 'name_single';

  const formatted = reformatObject(props.array);
  const formatstr = objectArrayToCsvString(formatted);

  const handleCopy = () => {
    clipboard.writeText(formatstr);
  };
  const handleSave = () => {
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

  function reformatObject(objarray) {
    let formatarray = [
      ['Time', objarray[0] ? objarray[0][titlekey].replace(',', '_') : '']
    ];

    let parsestr = '%d %b %H:%M';

    objarray.forEach(d => {
      formatarray.push([timeFormat(parsestr)(d['time']), d[valkey]]);
    });

    return formatarray;
  }

  function objectArrayToCsvString(objarray) {
    return objarray.map(obj => Object.values(obj).join(',')).join('\n');
  }

  return (
    <div className={classes.root}>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleCopy}
        disableRipple={true}
      >
        <AssignmentIcon />
      </Button>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleSave}
        disableRipple={true}
      >
        <SaveAltIcon />
      </Button>
    </div>
  );
};
export { CopySave };
