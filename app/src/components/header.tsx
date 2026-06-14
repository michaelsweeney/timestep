import React from 'react';
import Logo from './logo';
import FileMenu from './filemenu';
import ViewSelector from './viewselector';
import SettingsMenu from './settingsmenu';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  theme => ({
    root: {
      padding: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${theme.palette.divider}`,
      boxShadow: '0px 6px 7px -4px rgba(0,0,0,0.2)',
      width: '100%',
      height: 75,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      minWidth: 700
    },
    left: {
      display: 'flex',
      alignItems: 'center'
    },
    right: {
      display: 'flex',
      alignItems: 'center'
    },
    settings: {
      marginRight: 4
    },
    logo: {
      display: 'inline-block'
    },
    files: {
      marginLeft: 10,
      width: 115
    },
    views: {
      marginRight: 10
    }
  }),
  {
    name: 'header'
  }
);

const Header = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.left}>
        <div className={classes.settings}>
          <SettingsMenu />
        </div>
        <div className={classes.logo}>
          <Logo />
        </div>
      </div>
      <div className={classes.right}>
        <div className={classes.views}>
          <ViewSelector />
        </div>
        <div className={classes.files}>
          <FileMenu />
        </div>
      </div>
    </div>
  );
};

export default Header;
