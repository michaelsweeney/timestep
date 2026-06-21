import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Menu,
  MenuItem,
  Switch,
  Divider,
  ListItemText
} from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';
import { connect } from 'src/store';
import AboutDialog from './aboutdialog';

const REPO = 'https://github.com/michaelsweeney/timestep';
const openUrl = (url: string) => window.api.shell.openExternal(url);

// Circular gear button in the topbar (replaces the burger icon) that opens the
// settings popover: dark-mode toggle, links, About.
const useStyles = makeStyles(
  {
    root: { display: 'inline-flex', flex: 'none' },
    gear: {
      appearance: 'none',
      cursor: 'pointer',
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--hairline-2)',
      background: 'var(--panel-2)',
      color: 'var(--ink-dim)',
      transition: 'color .15s, border-color .15s',
      '&:hover': {
        color: 'var(--ink)',
        borderColor: 'var(--accent)'
      }
    },
    menuPaper: {
      background: 'var(--panel-2)',
      border: '1px solid var(--hairline-2)',
      borderRadius: 6,
      color: 'var(--ink)'
    }
  },
  { name: 'settings-menu' }
);

const SettingsMenu = props => {
  const classes = useStyles();
  const { theme, actions } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [aboutOpen, setAboutOpen] = React.useState(false);

  const handleClose = () => setAnchorEl(null);

  // External link items close the menu; the dark-mode row intentionally does
  // not, so the toggle is visible as it flips.
  const link = (url: string) => () => {
    openUrl(url);
    handleClose();
  };

  return (
    <div className={classes.root}>
      <button
        className={classes.gear}
        aria-label="settings"
        aria-controls="settings-menu"
        aria-haspopup="true"
        onClick={e => setAnchorEl(e.currentTarget)}
      >
        <SettingsIcon style={{ fontSize: 22 }} />
      </button>
      <Menu
        id="settings-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ className: classes.menuPaper }}
      >
        <MenuItem onClick={() => actions.toggleTheme()}>
          <ListItemText primary="Dark mode" />
          <Switch
            edge="end"
            color="primary"
            checked={theme === 'dark'}
            onChange={() => actions.toggleTheme()}
            onClick={e => e.stopPropagation()}
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={link(REPO)}>View on GitHub</MenuItem>
        <MenuItem onClick={link(`${REPO}/issues`)}>Report an Issue</MenuItem>
        <MenuItem onClick={link(`${REPO}/releases/latest`)}>
          Latest Release
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setAboutOpen(true);
            handleClose();
          }}
        >
          About timestep
        </MenuItem>
      </Menu>
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
};

const mapState = state => ({ theme: state.ui.theme });
export default connect(mapState)(SettingsMenu);
