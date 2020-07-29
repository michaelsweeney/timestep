import React, { useState, useEffect, useRef } from 'react';

import MultiSeries from '../multiseries'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { MultiLineLegend } from './multilinelegend';
import { ColorCategorySelect } from '../colorcategoryselect';
import { MultiLine } from '../charts/multiline';
import { ViewWrapper } from '../viewwrapper';
import { ControlsWrapper } from '../controlswrapper';
import { ControlsContent } from '../controlscontent';
import { CopySave } from '../copysave';

const MultiLineControl = props => {
  const [isLoading, setIsLoading] = useState(false);
  const [seriesArray, setSeriesArray] = useState([]);
  const [colorScheme, setColorScheme] = useState('schemeCategory10');
  const [seriesConfig, setSeriesConfig] = useState([]);
  const [activeTab, setActiveTab] = useState('tab-series');

  const plotContainer = useRef(null);
  const controlsVisibleHeight = 275;
  const controlsHiddenHeight = 50;
  const [controlsHeight, setControlsHeight] = useState(controlsVisibleHeight);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [plotDims, setPlotDims] = useState({ width: 0, height: 0 });

  const toggleHideControlsTabs = () => {
    if (controlsVisible) {
      setControlsVisible(false);
      setControlsHeight(controlsHiddenHeight);
    } else {
      setControlsVisible(true);
      setControlsHeight(controlsVisibleHeight);
    }
  };

  const handleTabChange = tag => {
    if (tag == activeTab) {
      toggleHideControlsTabs();
    } else {
      setControlsVisible(true);
      setControlsHeight(controlsVisibleHeight);
      setActiveTab(tag);
    }
  };

  useEffect(() => {
    setPlotDims({
      width: props.dims.width,
      height: Math.max(props.dims.height - controlsHeight - 20, 50)
    });
  }, [props.dims, controlsHeight]);

  const handleColorCategoryChange = e => {
    setColorScheme(e);
  };

  const handleSeriesSelect = (e, v) => {
    let arrayClone = [...seriesArray];
    let selectedkeys = v.map(tag => props.seriesLookupObj[tag]);
    let existingkeys = arrayClone.map(d => d[0].key);

    let toremove = [];
    existingkeys.forEach(existkey => {
      if (!selectedkeys.includes(existkey)) {
        toremove.push(existkey);
      }
    });

    arrayClone = arrayClone.filter(d => !toremove.includes(d[0].key));
    if (toremove.length >= 1) {
      setSeriesArray(arrayClone);
    }

    let promises = [];
    let newkeys = [];

    selectedkeys.forEach(key => {
      if (!existingkeys.includes(key)) {
        setIsLoading(true);
        newkeys.push(key);
        promises.push(getSeries(key, props.units));
      }
    });

    setIsLoading(true);
    Promise.all(promises).then(d => {
      d.forEach(a => arrayClone.push(a));
      setSeriesArray(arrayClone);
      setIsLoading(false);
    });
  };

  const handleLegendChange = v => {
    setSeriesConfig(v);
  };

  const handleSelectClose = () => {
    setActiveTab('tab-legend');
  };

  return (
    <>
      <ViewWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <MultiLine
          files={props.files}
          plotdims={plotDims}
          seriesConfig={seriesConfig}
          units={props.units}
          seriesArray={seriesArray}
        />
      </ViewWrapper>
      <ControlsWrapper
        height={controlsHeight}
        activetab={activeTab}
        tabChangeCallback={handleTabChange}
        isVisible={controlsVisible}
        toggleHideCallback={toggleHideControlsTabs}
      >
        <ControlsContent tag="tab-series" tabname="Series Select">
          <MultiSeries
            dispatchClose={handleSelectClose}
            seriesCallback={handleSeriesSelect}
            series={props.seriesOptions}
          />
        </ControlsContent>

        <ControlsContent tag="tab-legend" tabname="Legend">
          <MultiLineLegend
            files={props.files}
            legendCallback={handleLegendChange}
            seriesArray={seriesArray}
            colorScheme={colorScheme}
            units={props.units}
          />
        </ControlsContent>
        <ControlsContent tag="tab-options" tabname="Options">
          <ColorCategorySelect
            colorCategoryCallback={handleColorCategoryChange}
          />
        </ControlsContent>

        <ControlsContent tag="tab-export" tabname="Export">
          <CopySave
            array={seriesArray}
            arraytype="multi"
            units={props.units}
            files={props.files}
          ></CopySave>
        </ControlsContent>
      </ControlsWrapper>
    </>
  );
};

export { MultiLineControl };
