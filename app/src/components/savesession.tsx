import React, { useState, useEffect } from 'react';
import connect from '../store/connect';

import fs from 'fs';
import { remote } from 'electron';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Tooltip } from '@material-ui/core';
import { store } from '../store/configureStore';

const useStyles = makeStyles(
  {
    root: {
      paddingLeft: 20,
      paddingRight: 20,
      marginTop: 10,
      marginBottom: 10,
      whiteSpace: 'nowrap'
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
      <Button
        variant="outlined"
        color="primary"
        onClick={handleSave}
        disableRipple={true}
      >
        SAVE SESSION
      </Button>
    </div>
  );
};

// const mapStateToProps = state => {
//   return {
//     session: state.session,
//     views: state.views
//   };
// };

// export default connect(mapStateToProps)(SaveSession);
export default SaveSession;
