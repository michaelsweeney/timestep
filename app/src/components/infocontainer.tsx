import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { Button } from '@material-ui/core';
import { shell } from 'electron';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block'
    },

    button: {
      borderWidth: '0px !important',
      verticalAlign: 'bottom'
    }
  },
  {
    name: 'info-container'
  }
);

const handleLink = () => {
  let link = 'https://timestep.herokuapp.com';
  shell.openExternal(link);
};

const InfoContainer = props => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Button
        variant="outlined"
        color="primary"
        className={classes.button}
        onClick={handleLink}
        disableRipple={true}
      >
        <InfoOutlinedIcon />
      </Button>
    </div>
  );
};

export { InfoContainer };
