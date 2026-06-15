// import '../wdyr';
import React, { useState, useEffect } from 'react';

import { connect } from 'src/store';
import { makeStyles } from '@material-ui/core/styles';
import Version from './version';
import Header from './header';
import MappedViews from './views/mappedviews';
import NotificationSnackbar from './notificationsnackbar';
import '../css/app.global.css';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { grey } from '@material-ui/core/colors';
import CssBaseline from '@material-ui/core/CssBaseline';
import {
  StylesProvider,
  createGenerateClassName
} from '@material-ui/core/styles';

const makeTheme = (type: 'light' | 'dark') =>
  createMuiTheme({
    palette: {
      type,
      secondary: { main: grey[800] },
      // Dark mode: a slightly warmer near-black app surface with paper (menus,
      // dialogs) lifted above it for separation. Light mode keeps MUI defaults.
      ...(type === 'dark'
        ? {
            background: { default: '#1e1e20', paper: '#2a2a2e' }
          }
        : {})
    }
  });

const generateClassName = createGenerateClassName({
  productionPrefix: 'c',
  disableGlobal: true
});

const useStyles = makeStyles(
  {
    root: {
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      overflowY: 'hidden',
      overflowX: 'hidden',
      width: 'calc(100vw)',
      height: 'calc(100vh)'
    },
    // The pane area fills the space below the fixed-height header, so each
    // PaneFrame measures its true box (no more global "minus header" fudge).
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

  /* default ui setup for testing only*/
  // useEffect(() => {
  // const files = ['/Users/michaelsweeney/Downloads/Sample SQL Files/sim1.sql'];
  // props.actions.changeFiles(files);
  // props.actions.changeChartType('Heatmap', 1);
  // }, []);
  /* end default ui setup for testing only */

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
