import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      position: 'relative',
      width: '150px',
      paddingLeft: '20px',
      paddingRight: '80px',
      marginTop: '15px',
      borderTop: '2px solid rgba(0,0,0,0.15)',
      boxSizing: 'border-box'
    }
  },
  {
    name: 'sidebar-break'
  }
);

const LineBreak = props => {
  const classes = useStyles();
  return <div className={classes.root}></div>;
};

export { LineBreak };
