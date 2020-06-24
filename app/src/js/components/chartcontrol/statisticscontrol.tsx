import React, { useState, useRef } from 'react';

import MultiSeries from '../multiseries'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { Statistics } from '../charts/statistics';
import { ControlsContainer } from '../controlscontainer';
import { ViewWrapper } from './viewwrapper';
import { CopySave } from '../copysave';

const StatisticsControl = props => {
  const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);
        getSeries(key, props.units).then(d => {
          arrayClone.push(d);
          setSeriesArray(arrayClone);
          setIsLoading(false);
        });
      }
    });
  };

  return (
    <>
      <ViewWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <Statistics
          units={props.units}
          seriesArray={seriesArray}
          files={props.files}
        />
      </ViewWrapper>

      <ControlsContainer tag="statistics-controls-container">
        <MultiSeries
          seriesCallback={handleSeriesSelect}
          series={props.seriesOptions}
        />
      </ControlsContainer>
      <CopySave obj={seriesArray}></CopySave>
    </>
  );
};

export { StatisticsControl };
