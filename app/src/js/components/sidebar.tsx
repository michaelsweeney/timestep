import React from 'react';

import { FileList } from './filelist';
import { FileHandler } from './filehandler';
import { UnitRadio } from './unitradio';
import { TimeStepSelect } from './timestepselect';
import { ViewSelector } from './viewselector';
import { Logo } from './logo';
import { InfoContainer } from './infocontainer';

import { makeStyles } from '@material-ui/core/styles';
import { callbackify } from 'util';

const useStyles = makeStyles(
  {
    root: {
      paddingRight: 5,
      position: 'absolute',
      borderRight: '2px solid rgba(0,0,0,0.3)',
      height: '98vh',
      width: 175,
      textAlign: 'center',
      boxSizing: 'border-box',
      overflow: 'hidden'
    },
    topContainer: {
      height: 'calc(100% - 50px)'
    },
    bottomContainer: {
      // height: '75px'
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
      <div className={classes.topContainer}>
        <Logo></Logo>
        <FileHandler fileCallback={props.fileCallback} />
        <FileList fileInfo={props.fileInfo} />
        <UnitRadio unitCallback={props.unitCallback} />
        <TimeStepSelect timeStepCallback={props.timeStepCallback} />
        <ViewSelector activeViewCallback={props.activeViewCallback} />
      </div>
      <div className={classes.bottomContainer}>
        <InfoContainer />
      </div>
    </div>
  );
};

export { Sidebar };
