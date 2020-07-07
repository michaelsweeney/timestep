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
      // right: 5,
      // top: -15,
      // left: -5,
      // paddingTop: 20,
      // paddingBottom: 20,
      paddingRight: 5,
      position: 'absolute',
      borderRight: '2px solid rgba(0,0,0,0.3)',
      height: '98vh',
      // boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
      width: 175,
      textAlign: 'center',
      boxSizing: 'border-box',
      overflow: 'hidden',
      '& div': {
        // left: -5
      }
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
