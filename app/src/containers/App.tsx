import React, { useState, useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import connect from '../connect';
import { makeStyles } from '@material-ui/core/styles';
import Sidebar from '../components/sidebar';
import Views from '../components/views';
import '../css/app.global.css';
import { getFileSummary } from '../components/sql';

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

  const viewID = 1; // used as a dummy until future IDs are implemented for multiple charts.

  const { files } = props.session;

  /* programmatic ui - testing only */
  useEffect(() => {
    let tempfiles = [
      '/Users/michaelsweeney/Documents/energyplus files/sim1.sql',
      '/Users/michaelsweeney/Documents/energyplus files/sim2.sql'
    ];
    props.actions.changeFiles(tempfiles);
  }, []);

  /* end programmatic ui - testing only */
  useEffect(() => {
    getFileSummary(files).then(b => {
      props.actions.changeFileInfo(b);
    });
  }, [files]);

  const handleTestLoad = () => {
    let p = {
      files: ['/Users/michaelsweeney/Documents/energyplus files/sim1.sql'],
      view: 1,
      viewType: 'Heatmap',
      units: 'ip',
      key: '/Users/michaelsweeney/Documents/energyplus files/sim1.sql,6'
    };
    console.log(p);
    props.actions.changeFiles(p.files);
    props.actions.changeUnits(p.units);
    props.actions.changeViewType(p.viewType, p.view);
    props.actions.changeSelectedSeries(p.key, p.view);
  };

  return (
    <StylesProvider generateClassName={generateClassName}>
      <div className={classes.root}>
        <Sidebar handleTestLoad={handleTestLoad} />

        <Views />
      </div>
    </StylesProvider>
  );
};

const mapStateToProps = state => {
  return {
    ...state
  };
};
export default hot(connect(mapStateToProps)(App));
