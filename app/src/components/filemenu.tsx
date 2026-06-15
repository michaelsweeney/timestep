import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { Menu, MenuItem } from '@material-ui/core';
import FileList from './filelist';
import FileHandler from './filehandler';
import SaveSession from './savesession';
import LoadSession from './loadsession';
import { connect } from 'src/store';

// Flat "Files (N)" topbar chip (replaces the MUI contained "FILES" button) that
// opens the same menu: load files, file list / data-quality, save/load session.
const useStyles = makeStyles(
  {
    root: { display: 'inline-flex', flex: 'none' },
    btn: {
      appearance: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      borderRadius: 4,
      border: '1px solid var(--hairline-2)',
      background: 'var(--panel-2)',
      color: 'var(--ink-dim)',
      fontFamily: 'var(--sans)',
      fontWeight: 500,
      fontSize: 13,
      lineHeight: 1,
      padding: '7px 11px',
      transition: 'color .15s, border-color .15s',
      '&:hover': {
        color: 'var(--ink)',
        borderColor: 'var(--accent)'
      }
    },
    // file count = a value → mono, per the bnd-viz data/chrome split
    count: { color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--mono)' },
    menuPaper: {
      background: 'var(--panel-2)',
      border: '1px solid var(--hairline-2)',
      borderRadius: 6,
      color: 'var(--ink)'
    }
  },
  { name: 'file-menu' }
);

const FileMenu = props => {
  const classes = useStyles();
  const { fileCount } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <div className={classes.root}>
      <button
        className={classes.btn}
        aria-controls="file-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>⊞</span> Files
        {fileCount > 0 ? <span className={classes.count}>{fileCount}</span> : null}
      </button>
      <Menu
        id="file-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ className: classes.menuPaper }}
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

const mapStateToProps = state => ({ fileCount: state.session.files.length });

export default connect(mapStateToProps)(FileMenu);
