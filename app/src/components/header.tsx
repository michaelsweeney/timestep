import React from 'react';
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
      width: 'calc(100% - 15px)',
      height: 75,
      boxSizing: 'border-box',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },
    headerLeft: {
      display: 'inline-block',
      width: 'calc(100% - 150px)'
    },

    headerRight: {
      display: 'inline-block',
      width: '150px'
    },
    logo: {
      display: 'inline-block',
      verticalAlign: 'middle'
    },
    files: {
      marginRight: 10,
      marginLeft: 30,
      width: 125,
      paddingBottom: 5,
      display: 'inline-block',
      verticalAlign: 'middle'
    },
    views: {
      marginLeft: 10,
      marginRight: 10,
      display: 'inline-block',
      verticalAlign: 'middle'
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
        </div>{' '}
      </div>
    </div>
  );
};

export default Header;
