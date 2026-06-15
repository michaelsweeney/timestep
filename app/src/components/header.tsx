import React from 'react';
import Logo from './logo';
import FileMenu from './filemenu';
import ViewSelector from './viewselector';
import SettingsMenu from './settingsmenu';
import { Divider } from '@material-ui/core';
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
    // App-level settings sit left of a divider; data controls (files, views)
    // sit right of it — a meaningful grouping, not just decoration.
    vdivider: {
      height: 34,
      alignSelf: 'center',
      margin: '0 12px'
    },
    files: {
      width: 115
    },
    views: {
      marginLeft: 16
    },
    logo: {
      display: 'inline-block'
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
        <SettingsMenu />
        <Divider orientation="vertical" className={classes.vdivider} />
        <div className={classes.files}>
          <FileMenu />
        </div>
        <div className={classes.views}>
          <ViewSelector />
        </div>
      </div>
      <div className={classes.logo}>
        <Logo />
      </div>
    </div>
  );
};

export default Header;
