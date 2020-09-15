import React from 'react';
import UnitRadio from './unitradio';
import Logo from './logo';
import FileMenu from './filemenu';
import ViewSelector from './viewselector';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      padding: 5,
      margin: 5,
      display: 'inline-block',
      borderBottom: '1px solid rgba(0,0,0,0.3)',
      width: '100%',
      height: 75,
      boxSizing: 'border-box',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },
    logo: {
      display: 'inline-block'
    },
    files: {
      display: 'inline-block'
    },
    views: {
      display: 'inline-block'
    }
  },
  {
    name: 'header'
  }
);

const Header = props => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.files}>
        <FileMenu />
      </div>
      <ViewSelector />
      {/* <UnitRadio /> */}
      <div className={classes.logo}>
        <Logo />
      </div>
    </div>
  );
};

export default Header;
