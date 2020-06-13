import React, { useState, useRef } from 'react';

import MultiSeries from '../multiseries'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { Statistics } from './statistics';

const StatisticsControl = props => {
  const [seriesArray, setSeriesArray] = useState([]);
  const plotContainer = useRef(null);

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

  return (
    <React.Fragment>
      <div className="ref-container" ref={plotContainer}>
        <Statistics units={props.units} seriesArray={seriesArray} />
      </div>

      <div className="statistics-controls-container controls-container">
        <MultiSeries
          seriesCallback={handleSeriesSelect}
          series={props.seriesOptions}
        />
      </div>
    </React.Fragment>
  );
};

export { StatisticsControl };
