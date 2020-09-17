// import '../components/wdyr';
import React, { useState, useEffect } from 'react';

import { hot } from 'react-hot-loader/root';
import connect from '../store/connect';
import { makeStyles } from '@material-ui/core/styles';
import Header from '../components/header';
import Views from '../components/views';
import '../css/app.global.css';

import {
  StylesProvider,
  createGenerateClassName
} from '@material-ui/core/styles';

const generateClassName = createGenerateClassName({
  productionPrefix: 'c',
  disableGlobal: true
});

const useStyles = makeStyles(
  {
    root: {
      display: 'block',
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      boxSizing: 'border-box',
      overflowY: 'hidden',
      overflowX: 'hidden',
      width: 'calc(100vw)',
      height: 'calc(100vh)',
      padding: '10px'
    }
  },
  { name: 'main-container' }
);

const App = props => {
  const classes = useStyles();

  /* programmatic ui for testing*/
  useEffect(() => {
    let files = ['/Users/michaelsweeney/Documents/energyplus files/sim1.sql'];

    props.actions.changeFiles(files);
    props.actions.changeChartType('Heatmap', 1);
  }, []);

  /* end programmatic ui - testing only */

  return (
    <StylesProvider generateClassName={generateClassName}>
      <div className={classes.root}>
        <Header />
        <Views />
      </div>
    </StylesProvider>
  );
};

const mapStateToProps = state => {
  return {
    files: state.session.files
  };
};
export default hot(connect(mapStateToProps)(App));
