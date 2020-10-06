import React from 'react';
import Logo from './logo';
import FileMenu from './filemenu';
import ViewSelector from './viewselector';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      padding: 10,
      display: 'block',
      borderBottom: '1px solid rgba(0,0,0,0.3)',
      boxShadow: '0px 6px 7px -4px rgba(0,0,0,0.2)',
      width: '100%',
      height: 75,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      minWidth: 700
    },
    headerLeft: {
      paddingTop: 10,
      display: 'inline-block',
      width: 'calc(100% - 150px)'
    },

    headerRight: {
      display: 'inline-block',
      width: '150px'
    },
    logo: {
      display: 'inline-block',
      verticalAlign: 'top',
      position: 'relative',
      bottom: 10,
      right: 10
    },
    files: {
      marginRight: 10,
      marginLeft: 10,
      width: 115,
      paddingBottom: 5,
      display: 'inline-block',
      verticalAlign: 'top'
    },
    views: {
      // marginLeft: 10,
      marginRight: 10,
      display: 'inline-block',
      verticalAlign: 'top'
    }
  },
  {
    name: 'header'
  }
);

const Header = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.headerLeft}>
        <div className={classes.files}>
          <FileMenu />
        </div>

        <div className={classes.views}>
          <ViewSelector />
        </div>
      </div>
      <div className={classes.headerRight}>
        <div className={classes.logo}>
          <Logo />
        </div>
      </div>
    </div>
  );
};

export default Header;
