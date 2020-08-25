import React, { useState, useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import * as Actions from '../actions';
import { bindActionCreators } from 'redux';

import { getSeriesOptions, getFileSummary } from '../components/sqlload';

import Sidebar from '../components/sidebar';
import ViewControl from '../components/viewcontrol';
import { DEFAULTCONFIG } from '../defaultconfig';
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

  const viewID = 1; // used as a dummy until future IDs are available for multiple charts.

  const handleFileChange = f => {
    props.actions.changeFiles(f);

    getSeriesOptions({
      files: f,
      units: props.data.session.units
    }).then(res => {
      props.actions.changeAvailableSeries(res);
    });

    getFileSummary(f).then(res => {
      props.actions.changeFileInfo(res);
    });
  };

  const handleTimestepChange = v => {
    props.actions.changeTimestepType(v, viewID);
  };

  const handleUnitChange = u => {
    props.actions.changeUnits(u);
    getSeriesOptions({
      files: props.data.session.units,
      units: u
    }).then(res => {
      props.actions.changeAvailableSeries(res);
    });
  };

  const handleActiveViewChange = f => {
    props.actions.changeViewType(f, viewID);
  };

  useEffect(() => {
    if (DEFAULTCONFIG.isDev) {
      handleFileChange(DEFAULTCONFIG.defaultFiles);
    }
  }, []);

  return (
    <StylesProvider generateClassName={generateClassName}>
      <div className={classes.root}>
        <Sidebar
          views={['MultiLine', 'Heatmap', 'Scatter', 'Histogram', 'Statistics']}
          fileInfo={props.data.session.fileInfo}
          fileCallback={handleFileChange}
          timestepType={props.data.views[viewID].timestepType}
          timestepTypeCallback={handleTimestepChange}
          units={props.data.session.units}
          unitCallback={handleUnitChange}
          activeViewCallback={handleActiveViewChange}
        ></Sidebar>
        <ViewControl
          key={props.data.key}
          files={props.data.session.files}
          timestepType={props.data.views[viewID].timestepType}
          activeView={props.data.views[viewID].viewType}
        />
      </div>
    </StylesProvider>
  );
};

function mapStateToProps(state) {
  return {
    data: { ...state }
  };
}
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(Actions, dispatch)
  };
}

export default hot(connect(mapStateToProps, mapDispatchToProps)(App));
