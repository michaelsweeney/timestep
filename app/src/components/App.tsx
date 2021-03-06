// import '../wdyr';
import React, { useState, useEffect } from 'react';

import { hot } from 'react-hot-loader/root';
import { connect } from 'src/store';
import { makeStyles } from '@material-ui/core/styles';
import Version from './version';
import Header from './header';
import MappedViews from './views/mappedviews';
import '../css/app.global.css';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { grey } from '@material-ui/core/colors';
import CssBaseline from '@material-ui/core/CssBaseline';
import {
  StylesProvider,
  createGenerateClassName
} from '@material-ui/core/styles';

const theme = createMuiTheme({
  palette: {
    secondary: { main: grey[800] }
  }
});

const generateClassName = createGenerateClassName({
  productionPrefix: 'c',
  disableGlobal: true
});

const useStyles = makeStyles(
  {
    root: {
      display: 'block',
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      overflowY: 'hidden',
      overflowX: 'hidden',
      width: 'calc(100vw)',
      height: 'calc(100vh)'
    }
  },
  { name: 'main-container' }
);

const App = props => {
  const classes = useStyles();

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
          <MappedViews />
          <Version />
        </div>
      </StylesProvider>
    </ThemeProvider>
  );
};

const mapStateToProps = state => {
  return {
    // files: state.session.files
  };
};
export default hot(connect(mapStateToProps)(App));
