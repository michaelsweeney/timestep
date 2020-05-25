import React, { useState, useEffect } from 'react';

import MultiSeries from '../multiseries'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { MultiLineLegend } from './multilinelegend';
import { ColorCategorySelect } from '../colorcategoryselect';
import { MultiLine } from './multiline';

const MultiLineControl = props => {
  const [seriesArray, setSeriesArray] = useState([]);
  const [colorScheme, setColorScheme] = useState('schemeCategory10');
  const [seriesConfig, setSeriesConfig] = useState([]);

  const handleColorCategoryChange = e => {
    setColorScheme(e);
  };

  const handleSeriesSelect = (e, v) => {
    let arrayClone = [...seriesArray];
    let newkeys = v.map(tag => props.seriesLookupObj[tag]);
    let existingkeys = arrayClone.map(d => d[0].key);

    let toremove = [];
    existingkeys.forEach(existkey => {
      if (!newkeys.includes(existkey)) {
        toremove.push(existkey);
      }
    });

    arrayClone = arrayClone.filter(d => !toremove.includes(d[0].key));
    if (toremove.length >= 1) {
      setSeriesArray(arrayClone);
    }

    newkeys.forEach(key => {
      if (!existingkeys.includes(key)) {
        getSeries(key, props.units).then(d => {
          arrayClone.push(d);
          setSeriesArray(arrayClone);
        });
      }
    });
  };

  const handleLegendChange = v => {
    setSeriesConfig(v);
  };

  return (
    <div>
      <MultiLine
        seriesConfig={seriesConfig}
        units={props.units}
        seriesArray={seriesArray}
      />
      <MultiLineLegend
        legendCallback={handleLegendChange}
        seriesArray={seriesArray}
        colorScheme={colorScheme}
        units={props.units}
      />
      <ColorCategorySelect colorCategoryCallback={handleColorCategoryChange} />

      <MultiSeries
        seriesCallback={handleSeriesSelect}
        series={props.seriesOptions}
      />
    </div>
  );
};

export { MultiLineControl };
