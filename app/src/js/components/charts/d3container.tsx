import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      height: 'calc(100vh - 300px)'
    }
  },
  { name: `d3-container` }
);

const D3Container = props => {
  const classes = useStyles({ tag: props.tag });
  return <div className={classes.root} ref={props.refcontainer}></div>;
};

export { D3Container };
