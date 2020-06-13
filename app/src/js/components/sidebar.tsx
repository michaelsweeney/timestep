import React from 'react';

import { FileList } from './filelist';
import { FileHandler } from './filehandler';
import { UnitRadio } from './unitradio';
import { TimeStepSelect } from './timestepselect';
import { ViewSelector } from './viewselector';
import { Logo } from './logo';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      top: -15,
      left: -5,
      paddingTop: 20,
      paddingBottom: 10,
      position: 'absolute',
      height: '125vh',
      boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
      width: 175,
      textAlign: 'center',
      boxSizing: 'border-box'
    }
  },
  {
    name: 'sidebar'
  }
);

const Sidebar = props => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Logo></Logo>
      <FileHandler fileCallback={props.fileCallback} />
      <FileList fileInfo={props.fileInfo} />
      <UnitRadio unitCallback={props.unitCallback} />
      <TimeStepSelect timeStepCallback={props.timeStepCallback} />
      <ViewSelector activeViewCallback={props.activeViewCallback} />
    </div>
  );
};

export { Sidebar };
