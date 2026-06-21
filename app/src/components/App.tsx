// import '../wdyr';
import React, { useEffect } from 'react';

import { connect } from 'src/store';
import { makeStyles } from '@material-ui/core/styles';
import Version from './version';
import Header from './header';
import MappedViews from './views/mappedviews';
import NotificationSnackbar from './notificationsnackbar';
import '../css/app.global.css';
import { tokensFor, SANS, ThemeName } from '../css/tokens';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import {
  StylesProvider,
  createGenerateClassName
} from '@material-ui/core/styles';

// Theme now lives in the CSS token sets (app.global.css :root / [data-theme]).
// Toggling ui.theme swaps the data-theme attribute on <html>, which re-points
// every var(--...) — that drives the chrome and the d3 charts. We KEEP MUI's
// ThemeProvider alive so the retained MUI primitives (Autocomplete, Slider,
// Dialog/Menu/Switch) theme too, building its palette from the SAME tokens so
// both stay in lock-step.
const makeTheme = (type: ThemeName) => {
  const t = tokensFor(type);
  return createMuiTheme({
    palette: {
      type,
      primary: { main: t.accent },
      secondary: { main: t.accent },
      background: { default: t.bg, paper: t.panel2 },
      text: { primary: t.ink, secondary: t.inkDim, disabled: t.inkFaint },
      divider: t.hairline
    },
    typography: { fontFamily: SANS },
    overrides: {
      MuiPaper: { root: { backgroundImage: 'none' } }
    }
  });
};

const generateClassName = createGenerateClassName({
  productionPrefix: 'c',
  disableGlobal: true
});

const useStyles = makeStyles(
  {
    root: {
      display: 'flex',
      flexDirection: 'column',
      fontFamily: SANS,
      overflowY: 'hidden',
      overflowX: 'hidden',
      width: '100vw',
      height: '100vh',
      background: 'var(--bg)',
      color: 'var(--ink)'
    },
    // The pane area fills the space below the fixed-height header, so each
    // PaneFrame measures its true box.
    viewsWrap: {
      flex: 1,
      minHeight: 0
    }
  },
  { name: 'main-container' }
);

const App = props => {
  const classes = useStyles();
  const theme = React.useMemo(() => makeTheme(props.theme), [props.theme]);

  // Drive the CSS token sets: data-theme on <html> repoints every var(--...).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', props.theme);
  }, [props.theme]);

  return (
    <ThemeProvider theme={theme}>
      <StylesProvider generateClassName={generateClassName}>
        <CssBaseline />
        <div className={classes.root}>
          <Header />
          <div className={classes.viewsWrap}>
            <MappedViews />
          </div>
          <Version />
          <NotificationSnackbar />
        </div>
      </StylesProvider>
    </ThemeProvider>
  );
};

const mapStateToProps = state => {
  return {
    theme: state.ui.theme
  };
};
export default connect(mapStateToProps)(App);
