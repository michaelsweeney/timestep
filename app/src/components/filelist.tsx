import React, { useState, useEffect } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import connect from '../connect';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Modal
} from '@material-ui/core';

function getModalStyle() {
  const pad = 50; // what does this do?
  return {
    top: `${pad}%`,
    left: `${pad}%`,
    transform: `translate(-${pad}%, -${pad}%)`
  };
}

const useStyles = makeStyles(
  (theme: Theme) =>
    createStyles({
      root: {
        display: 'inline-block',
        marginTop: 10,
        marginLeft: 10,
        marginRight: 5,
        boxSizing: 'border-box',
        '& button': {
          width: 115
        }
      },
      paper: {
        position: 'absolute',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3)
      },
      table: {},
      title: { fontSize: 20, margin: '5px', textAlign: 'center' }
    }),
  {
    name: 'file-info'
  }
);

function FileList(props) {
  const [modalStyle] = React.useState(getModalStyle);

  const classes = useStyles();

  const { fileInfo } = props;
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

  return (
    <div className={classes.root}>
      <Button
        disableRipple={true}
        variant="outlined"
        color="primary"
        onClick={handleClick}
      >
        FILE INFO
      </Button>
      <Modal open={open} onClose={handleClose}>
        <div style={modalStyle} className={classes.paper}>
          <div className={classes.title}>Loaded Files</div>
          <TableContainer component={Paper}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell>Filename</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Timestep Frequency</TableCell>
                  <TableCell>E+ version</TableCell>
                  <TableCell>Report Count</TableCell>
                  <TableCell>BND loaded</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fileInfo.map(f => (
                  <TableRow key={f.filename}>
                    <TableCell>{f.filename}</TableCell>
                    <TableCell>{f.timestamp}</TableCell>
                    <TableCell>{f.timesteps}</TableCell>
                    <TableCell>
                      {
                        f.version
                          .replace('EnergyPlus, Version ', '')
                          .split('-')[0]
                      }
                    </TableCell>
                    <TableCell>{f.numreports}</TableCell>
                    <TableCell>{f.bndexists ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </Modal>
    </div>
  );
}

const mapStateToProps = state => {
  return {
    fileInfo: state.session.fileInfo
  };
};

export default connect(mapStateToProps)(FileList);
