import React, { useState, useEffect } from 'react';
import SettingsIcon from '@material-ui/icons/Settings';

import { makeStyles } from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';

import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const useStyles = makeStyles(
  {
    root: {
      width: 1000
    },
    popover: {
      width: window.innerWidth - 200
    },
    icon: {
      display: 'inline-block',
      '&:hover': {
        color: 'red',
        cursor: 'pointer'
      }
    }
  },
  {
    name: 'settings-container'
  }
);

const SettingsContainer = props => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <>
      {/* <ExpansionPanel
        className={classes.root}
        id={id}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={{ top: window.innerHeight - 200, left: 200 }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <SettingsIcon className={classes.icon} />
        </ExpansionPanelSummary>
        <ExpansionPanelDetails> */}
      <div className={classes.popover}>{props.children}</div>
      {/* </ExpansionPanelDetails> */}
      {/* </ExpansionPanel> */}
    </>
  );
};

export { SettingsContainer };
