import React, { useState, useEffect } from 'react';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sqlload';

import {
  Radio,
  Select,
  Checkbox,
  Slider,
  Button,
  ButtonGroup
} from '@material-ui/core';

const HeatmapControl = props => {
  const [series, setSeries] = useState([]);
  const handleSeriesSelect = (e, v) => {
    getSeries(props.seriesLookupObj[v], props.units).then(d => {
      setSeries(d);
    });
  };

  return (
    <div>
      <SeriesSelect
        seriesCallback={handleSeriesSelect}
        series={props.seriesOptions}
      />
      <SeriesSelect
        seriesCallback={handleSeriesSelect}
        series={props.seriesOptions}
      />
    </div>
  );
};

export { HeatmapControl };
