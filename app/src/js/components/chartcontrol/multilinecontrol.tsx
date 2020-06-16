import React, { useState, useEffect, useRef } from 'react';

import MultiSeries from '../multiseries'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { MultiLineLegend } from './multilinelegend';
import { ColorCategorySelect } from '../colorcategoryselect';
import { ControlsContainer } from '../controlscontainer';
import { MultiLine } from '../charts/multiline';
import { getBBSize } from '../plotdimensions';
import { ViewWrapper } from './viewwrapper';

const MultiLineControl = props => {
  const [isLoading, setIsLoading] = useState(false);

  const [seriesArray, setSeriesArray] = useState([]);
  const [colorScheme, setColorScheme] = useState('schemeCategory10');
  const [seriesConfig, setSeriesConfig] = useState([]);
  const [plotdims, setPlotdims] = useState({ width: 50, height: 50 });
  const plotContainer = useRef(null);

  useEffect(() => {
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(
        () => setPlotdims(getBBSize(plotContainer)),
        250
      );
    }
    let resizeTimer;
    window.addEventListener('resize', handleResize);
    setPlotdims(getBBSize(plotContainer));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      setIsLoading(true);
      if (!existingkeys.includes(key)) {
        getSeries(key, props.units).then(d => {
          arrayClone.push(d);
          setSeriesArray(arrayClone);
          setIsLoading(false);
        });
      }
    });
  };

  const handleLegendChange = v => {
    setSeriesConfig(v);
  };

  return (
    <>
      <ViewWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <MultiLine
          files={props.files}
          plotdims={plotdims}
          seriesConfig={seriesConfig}
          units={props.units}
          seriesArray={seriesArray}
        />
      </ViewWrapper>
      <MultiLineLegend
        files={props.files}
        legendCallback={handleLegendChange}
        seriesArray={seriesArray}
        colorScheme={colorScheme}
        units={props.units}
      />

      <ControlsContainer tag="multiline-controls-container">
        <ColorCategorySelect
          colorCategoryCallback={handleColorCategoryChange}
        />

        <MultiSeries
          seriesCallback={handleSeriesSelect}
          series={props.seriesOptions}
        />
      </ControlsContainer>
    </>
  );
};

export { MultiLineControl };
