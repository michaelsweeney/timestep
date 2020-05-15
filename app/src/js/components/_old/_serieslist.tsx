import React, { useState, useEffect } from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import { createFilterOptions } from '@material-ui/lab/Autocomplete';

// import { useTheme, makeStyles } from '@material-ui/core/styles';

import { loadAllSeries, getSeries } from '../sqlload';

const SeriesList = props => {
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [seriesKeys, setSeriesKeys] = useState([]);
  const [keyObj, setKeyObj] = useState({});

  useEffect(() => {
    loadAllSeries(props.files).then(ar => {
      let opts = [];
      let keyarray = [];
      let _keyobj = {};

      if (props.units == 'ip') {
        opts = ar.map(d => d.name_ip);
        keyarray = ar.map(d => d.key);
        for (let i = 0; i < keyarray.length; i++) {
          let currentKey = opts[i];
          let currentVal = keyarray[i];
          _keyobj[currentKey] = currentVal;
        }
      }
      if (props.units == 'si') {
        opts = ar.map(d => d.name_si);
        keyarray = ar.map(d => d.key);
        for (let i = 0; i < keyarray.length; i++) {
          let currentKey = opts[i];
          let currentVal = keyarray[i];
          _keyobj[currentKey] = currentVal;
        }
      }
      setKeyObj(_keyobj);
      setSeriesOptions(opts);
    });
  }, [props.files]);

  const handleSeriesSelect = e => {
    let val = e.target.innerHTML;
    props.seriesCallback(keyObj[val]);
  };

  return (
    <div>
      <Autocomplete
        onChange={handleSeriesSelect}
        id="demo"
        options={seriesOptions}
        renderInput={params => (
          <TextField {...params} label="Available Series" variant="outlined" />
        )}
      />
    </div>
  );
};

export { SeriesList };
