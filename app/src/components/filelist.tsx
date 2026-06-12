import React, { useState, useEffect } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import {connect} from 'src/store';
import { getFileSummary, getDataQuality } from 'src/sql';
import type { FileDataQuality } from 'src/sql';

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
      root: {},
      paper: {
        position: 'absolute',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3)
      },
      table: {},
      title: { fontSize: 20, margin: '5px', textAlign: 'center' },
      dqSection: { marginTop: 18 },
      dqHeading: { fontSize: 16, fontWeight: 600, marginBottom: 6 },
      dqFile: { fontSize: 13, fontWeight: 600, marginTop: 10 },
      dqList: { margin: '2px 0 0 0', paddingLeft: 18 },
      dqOk: { fontSize: 13, color: theme.palette.success?.main || '#2e7d32' },
      dqWarn: { fontSize: 13, color: theme.palette.warning?.main || '#b26a00' },
      dqInfo: { fontSize: 13, color: theme.palette.text.secondary },
      dqDetail: { fontSize: 12, color: theme.palette.text.secondary, fontStyle: 'italic' }
    }),
  {
    name: 'file-info'
  }
);

// Drop the directory; keep just the filename for display.
const baseName = (p: string) => p.replace(/\\/g, '/').split('/').pop() || p;

function FileList(props) {
  const { files, fileInfo } = props;
  const [modalStyle] = useState(getModalStyle);
  const [controlledOpen, setControlledOpen] = useState(false);
  const [dataQuality, setDataQuality] = useState<FileDataQuality[]>([]);
  const classes = useStyles();

  useEffect(() => {
    getFileSummary(files).then(f => {
      props.actions.changeFileInfo(f);
    });
    // Load-time fidelity warnings (cfm-default flows, name-guessed fluids,
    // SI-only units, …). Non-blocking — failures just leave the section empty.
    getDataQuality(files)
      .then(setDataQuality)
      .catch(() => setDataQuality([]));
  }, [files]);

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setControlledOpen(false);
  };

  useEffect(() => {
    if (fileInfo.length > 0) {
      setControlledOpen(true);
    }
  }, [fileInfo]);

  const open = Boolean(anchorEl) || controlledOpen;

  return (
    <div className={classes.root}>
      <div onClick={handleClick}>File Info</div>
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

          {dataQuality.length > 0 && (
            <div className={classes.dqSection}>
              <div className={classes.dqHeading}>Data quality</div>
              {dataQuality.map(fq => (
                <div key={fq.filename}>
                  <div className={classes.dqFile}>{baseName(fq.filename)}</div>
                  {fq.warnings.length === 0 ? (
                    <div className={classes.dqOk}>✓ No issues detected</div>
                  ) : (
                    <ul className={classes.dqList}>
                      {fq.warnings.map((w, i) => (
                        <li
                          key={i}
                          className={
                            w.severity === 'warning' ? classes.dqWarn : classes.dqInfo
                          }
                        >
                          {w.message}
                          {w.detail && (
                            <div className={classes.dqDetail}>{w.detail}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

const mapStateToProps = state => {
  return {
    files: state.session.files,
    fileInfo: state.session.fileInfo
  };
};

export default connect(mapStateToProps)(FileList);
