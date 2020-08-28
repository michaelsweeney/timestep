import React, { useState, useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import connect from '../connect';
import { makeStyles } from '@material-ui/core/styles';
import Sidebar from '../components/sidebar';
import ViewControl from '../components/viewcontrol';
import '../css/app.global.css';
import { getAllSeries, getFileSummary, getSeries } from '../components/sql';

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

  // update available series on unit or  switch
  useEffect(() => {
    // props.actions.changeFiles(files);
    // getAllSeries(files).then(res => {
    // props.actions.changeAvailableSeries(res);
    // });

    getFileSummary(files).then(b => {
      props.actions.changeFileInfo(b);
    });
  }, [files]);

  return (
    <StylesProvider generateClassName={generateClassName}>
      <div className={classes.root}>
        <Sidebar
          views={['MultiLine', 'Heatmap', 'Scatter', 'Histogram', 'Statistics']}
          fileInfo={props.session.fileInfo}
          timestepType={props.views[viewID].timestepType}
          units={props.session.units}
        ></Sidebar>
        <ViewControl />
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
