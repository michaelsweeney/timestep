import React, { useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { Button, Menu, MenuItem } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import FileList from './filelist';
import FileHandler from './filehandler';
import SaveSession from './savesession';
import LoadSession from './loadsession';
import Logo from './logo';
const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      boxSizing: 'border-box'
    }
  },
  { name: 'file-menu' }
);

const FileMenu = props => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <div className={classes.root}>
      <Button
        aria-controls="file-menu"
        aria-haspopup="true"
        color="primary"
        variant="contained"
        onClick={handleClick}
        disableRipple={true}
      >
        FILES
        <ArrowDropDownIcon />
      </Button>
      <Menu
        id="file-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem disableRipple={true} onClick={handleClose}>
          <FileHandler />
        </MenuItem>
        <MenuItem disableRipple={true} onClick={handleClose}>
          <FileList />
        </MenuItem>
        <MenuItem disableRipple={true} onClick={handleClose}>
          <SaveSession />
        </MenuItem>
        <MenuItem disableRipple={true} onClick={handleClose}>
          <LoadSession />
        </MenuItem>
      </Menu>
    </div>
  );
};

export default FileMenu;
