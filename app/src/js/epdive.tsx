import React, { useState, useEffect } from 'react';
import fs from 'fs';
import { loadAllSeries, getSeries } from './components/sqlload';

import { FileList } from './components/filelist';
import { FileHandler } from './components/filehandler';
import { UnitRadio } from './components/unitradio';
import { TimeStepSelect } from './components/timestepselect';
import { ViewSelector } from './components/viewselector';
import { ViewControl } from './components/viewcontrol';
import { defaultView, defaultStep } from './components/defaults';
import '../css/app.global.css';

const EpDive = () => {
  const [files, setFiles] = useState([]);
  const [units, setUnits] = useState('si');
  const [activeView, setActiveView] = useState(defaultView);
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [timestepType, setTimestepType] = useState(defaultStep);
  const [seriesLookupObj, setSeriesLookupObj] = useState({});
  const handleFileChange = f => {
    setFiles(f);
    handleSeriesOptions(f, units, timestepType);
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
    <div className="main-container">
      <div className="sidebar">
        <FileHandler fileCallback={handleFileChange} />
        <FileList files={files} />

        <UnitRadio unitCallback={handleUnitChange} />
        <TimeStepSelect timeStepCallback={handleTimeStepSelect} />
        <ViewSelector activeViewCallback={handleActiveViewChange} />
      </div>
      <ViewControl
        units={units}
        seriesOptions={seriesOptions}
        seriesLookupObj={seriesLookupObj}
        files={files}
        timestepType={timestepType}
        activeView={activeView}
      />

      {/* <Heatmap series={series} units={units} /> */}
    </div>
  );
};

export { EpDive };
