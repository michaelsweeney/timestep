import React from 'react';

import FileList from './filelist';
import FileHandler from './filehandler';
import UnitRadio from './unitradio';
import TimeStepSelect from './timestepselect';
import ViewSelector from './viewselector';
import { Logo } from './logo';
import SaveSession from './savesession';
import LoadSession from './loadsession';

import { InfoContainer } from './infocontainer';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      paddingRight: 5,
      display: 'inline-block',
      borderRight: '1px solid rgba(0,0,0,0.3)',
      height: '100%',
      width: 175,
      textAlign: 'center',
      boxSizing: 'border-box',
      overflow: 'hidden'
    },
    topContainer: {
      height: 'calc(100% - 50px)',
      overflow: 'hidden'
    },
    bottomContainer: {
      backgroundColor: 'white'
    },
    lineBreak: {
      display: 'inline-block',
      position: 'relative',
      width: '150px',
      paddingLeft: '20px',
      paddingRight: '80px',
      marginTop: '15px',
      borderTop: '1px solid rgba(0,0,0,0.15)',
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
      <div className={classes.topContainer}>
        <Logo></Logo>
        <FileHandler />
        <FileList />
        <SaveSession />
        <LoadSession />
        <div className={classes.lineBreak} />
        <UnitRadio />
        <TimeStepSelect />
        <div className={classes.lineBreak} />
        <ViewSelector />
      </div>
      <div className={classes.bottomContainer}>
        <InfoContainer />
      </div>
    </div>
  );
};

export default Sidebar;
