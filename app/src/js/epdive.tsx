import React, { useState, useEffect } from 'react';
import { loadAllSeries, getFileSummary } from './components/sqlload';
import { Sidebar } from './components/sidebar';
import { ViewControl } from './components/viewcontrol';
import { defaultView, defaultStep } from './components/defaults';
import '../css/app.global.css';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      display: 'block',
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      boxSizing: 'border-box',
      overflowY: 'hidden'
    }
  },
  { name: 'main-container' }
);

const EpDive = () => {
  const [files, setFiles] = useState([]);
  const [fileInfo, setFileInfo] = useState([]);
  const [units, setUnits] = useState('si');
  const [activeView, setActiveView] = useState(defaultView);
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [timestepType, setTimestepType] = useState(defaultStep);
  const [seriesLookupObj, setSeriesLookupObj] = useState({});

  const [key, setKey] = useState(0);

  const classes = useStyles();

  useEffect(() => {
    setKey(key + 1);
  }, [files, units, timestepType]);

  const handleFileChange = f => {
    setFiles(f);
    handleSeriesOptions(f, units, timestepType);

    getFileSummary(f).then(result => {
      setFileInfo(result);
    });
  };

  const handleUnitChange = u => {
    setUnits(u);
    handleSeriesOptions(files, u, timestepType);
  };

  const handleActiveViewChange = f => {
    setActiveView(f);
  };

  const handleSeriesOptions = (files, units, timestepType) => {
    loadAllSeries(files, timestepType).then(d => {
      if (units == 'ip') {
        let _keyobj = {};
        let ar = d.map(e => e.name_ip);
        let keys = d.map(e => e.key);
        for (let i = 0; i < keys.length; i++) {
          let currentKey = ar[i];
          let currentVal = keys[i];
          _keyobj[currentKey] = currentVal;
        }
        setSeriesLookupObj(_keyobj);
        setSeriesOptions(ar);
      }
      if (units == 'si') {
        let _keyobj = {};
        let ar = d.map(e => e.name_si);
        let keys = d.map(e => e.key);
        for (let i = 0; i < keys.length; i++) {
          let currentKey = ar[i];
          let currentVal = keys[i];
          _keyobj[currentKey] = currentVal;
        }
        setSeriesOptions(ar);
        setSeriesLookupObj(_keyobj);
      }
    });
  };

  const handleTimeStepSelect = v => {
    setTimestepType(v);
    handleSeriesOptions(files, units, v);
  };

  // default for dev
  useEffect(() => {
    handleFileChange([
      // '/Users/michaelsweeney/Documents/energyplus files/example/output-5ZoneDetailedIceStorage/5ZoneDetailedIceStorageout.sql'
      '/Users/michaelsweeney/Documents/energyplus files/chop_shade_array.sql'
    ]);
  }, []);

  return (
    <div className={classes.root}>
      <Sidebar
        fileCallback={handleFileChange}
        fileInfo={fileInfo}
        unitCallback={handleUnitChange}
        timeStepCallback={handleTimeStepSelect}
        activeViewCallback={handleActiveViewChange}
      ></Sidebar>
      <ViewControl
        key={key}
        units={units}
        seriesOptions={seriesOptions}
        seriesLookupObj={seriesLookupObj}
        files={files}
        timestepType={timestepType}
        activeView={activeView}
      />
    </div>
  );
};

export { EpDive };
