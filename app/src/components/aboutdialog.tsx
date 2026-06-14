import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Link
} from '@material-ui/core';
import { connect } from 'src/store';

const REPO = 'https://github.com/michaelsweeney/timestep';
const openUrl = (url: string) => window.api.shell.openExternal(url);

const AboutDialog = props => {
  const { open, onClose, version } = props;

  const ext = (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    openUrl(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>About timestep</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" gutterBottom>
          {version}
        </Typography>
        <Typography variant="body2" gutterBottom>
          A fast EnergyPlus timeseries visualization tool — load a .sql or .eso
          output and explore it interactively, no re-run needed.
        </Typography>
        <Typography variant="body2" component="div" style={{ marginTop: 12 }}>
          <Link href="#" onClick={ext(REPO)}>
            GitHub repository
          </Link>
          <br />
          <Link href="#" onClick={ext(`${REPO}/issues`)}>
            Report an issue
          </Link>
          <br />
          <Link href="#" onClick={ext(`${REPO}/releases/latest`)}>
            Latest release
          </Link>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const mapState = state => ({ version: state.session.version });
export default connect(mapState)(AboutDialog);
