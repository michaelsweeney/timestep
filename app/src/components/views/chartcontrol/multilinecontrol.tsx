import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'src/store';

import { getSeries, getSeriesKeys } from 'src/sql';

import { Multiline } from './charts/Multiline';
import { ChartWrapper } from './chartwrapper';

import colorscale from './colorscaleindex';

import {
  CopySave,
  ControlsWrapper,
  ControlsContent,
  ColorCategorySelect,
  MultiSeriesSelect,
  MultilineLegend
} from './controls';

const MultilineControl = props => {
  const plotContainer = useRef(null);

  const { viewID } = props;

  const { containerDims, files, units, isLoadingFromFile } = props.session;

  const {
    seriesOptions,
    isLoading,
    loadedObj,
    selectedSeries,
    selectedSeriesLabel
  } = props.view;

  const optionArray = Object.keys(seriesOptions);
  const seriesData = Object.values(loadedObj);

  const [colorScheme, setColorScheme] = useState('schemeTableau10');
  const [seriesConfig, setSeriesConfig] = useState([]);
  const [activeTab, setActiveTab] = useState('tab-series');
  const [zoomDomain, setZoomDomain] = useState([]);

  const getControlsVisibleHeight = () =>
    225 + Math.max(seriesConfig.length - 3, 0) * 30;
  const controlsHiddenHeight = 100;
  const [controlsHeight, setControlsHeight] = useState(
    getControlsVisibleHeight()
  );
  const [controlsVisible, setControlsVisible] = useState(true);

  const toggleHideControlsTabs = () => {
    if (controlsVisible) {
      setControlsVisible(false);
      setControlsHeight(controlsHiddenHeight);
    } else {
      setControlsVisible(true);
      setControlsHeight(getControlsVisibleHeight());
    }
  };

  const handleTabChange = tag => {
    if (tag == activeTab) {
      toggleHideControlsTabs();
    } else {
      setControlsVisible(true);
      setControlsHeight(getControlsVisibleHeight());
      setActiveTab(tag);
    }
  };

  const plotDims = {
    width: Math.max(containerDims.width, 200),
    height: Math.max(containerDims.height - controlsHeight, 200)
  };

  const seriesLoad = (newkeys, existingkeys, labels, viewID) => {
    let keysToAdd = [];
    let keysToRemove = [];
    newkeys.forEach(key => {
      if (!existingkeys.includes(key)) {
        keysToAdd.push(key);
      }
    });
    existingkeys.forEach(key => {
      if (!newkeys.includes(key)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => {
      props.actions.removeFromLoadedArray(key, viewID);
    });

    keysToAdd.forEach(key => {
      props.actions.addKeyToQueue(key, viewID);
      getSeries(key).then(d => {
        props.actions.addToLoadedArray(key, d, viewID);
        props.actions.removeKeyFromQueue(key, viewID);
        props.actions.setLoadingFromFile(false);
      });
    });
    props.actions.changeSelectedSeries(newkeys, viewID);
    props.actions.changeSelectedSeriesLabel(labels, viewID);
  };

  const handleSeriesSelect = (e, v) => {
    let newkeys = v.map(d => seriesOptions[d]);
    let existingkeys = selectedSeries;
    let labels = v;
    seriesLoad(newkeys, existingkeys, labels, viewID);
  };

  useEffect(() => {
    if (isLoadingFromFile) {
      seriesLoad(selectedSeries, [], selectedSeriesLabel, viewID);
    }
  }, [isLoadingFromFile]);

  // config handlers

  useEffect(() => {
    let config = [];
    let { name } = getSeriesKeys(units, files);
    seriesData.forEach((d, i) => {
      config.push({
        name: d[0][name],
        key: d[0].key,
        color: colorscale[colorScheme][i],
        yaxis: 'Y1',
        visible: true,
        highlighted: false
      });
    });
    setSeriesConfig(config);
  }, [loadedObj, colorScheme]);

  const handleYAxisChange = e => {
    let arraynum = e;
    let stateCopy = [...seriesConfig];
    stateCopy[arraynum].yaxis = stateCopy[arraynum].yaxis == 'Y1' ? 'Y2' : 'Y1';
    setSeriesConfig(stateCopy);
  };

  const handleVisibleChange = e => {
    let arraynum = e;
    let stateCopy = [...seriesConfig];
    stateCopy[arraynum].visible = !stateCopy[arraynum].visible;
    setSeriesConfig(stateCopy);
  };

  const handleColorCategoryChange = e => {
    let scheme = e;
    let stateCopy = [...seriesConfig];
    setColorScheme(e);
  };

  const handleRemoveSeries = e => {
    props.actions.removeFromLoadedArray(e, viewID);
  };

  // chart ui changes
  const handleZoomChange = domain => {
    setZoomDomain(domain);
  };

  const handleSelectClose = () => {
    setControlsHeight(getControlsVisibleHeight());
  };

  return (
    <>
      <ChartWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <Multiline
          zoomCallback={handleZoomChange}
          zoomDomain={zoomDomain}
          files={files}
          plotdims={plotDims}
          seriesConfig={seriesConfig}
          units={units}
          seriesArray={seriesData}
        />
      </ChartWrapper>
      <ControlsWrapper
        height={controlsHeight}
        activetab={activeTab}
        tabChangeCallback={handleTabChange}
        isVisible={controlsVisible}
        toggleHideCallback={toggleHideControlsTabs}
      >
        <ControlsContent tag="tab-series" tabname="Series Select">
          <MultiSeriesSelect
            value={selectedSeriesLabel}
            dispatchClose={handleSelectClose}
            seriesCallback={handleSeriesSelect}
            series={optionArray}
          />
        </ControlsContent>

        <ControlsContent tag="tab-legend" tabname="Legend">
          <MultilineLegend
            colorScheme={colorScheme}
            seriesConfig={seriesConfig}
            yAxisCallback={handleYAxisChange}
            visibleCallback={handleVisibleChange}
            removeSeriesCallback={handleRemoveSeries}
          />
        </ControlsContent>
        <ControlsContent tag="tab-options" tabname="Options">
          <ColorCategorySelect
            colorCategoryCallback={handleColorCategoryChange}
          />
        </ControlsContent>

        <ControlsContent tag="tab-export" tabname="Export">
          <CopySave viewID={viewID} arraytype="multi"></CopySave>
        </ControlsContent>
      </ControlsWrapper>
    </>
  );
};

const mapStateToProps = (state, ownProps) => {
  return {
    session: { ...state.session },
    view: { ...state.views[ownProps.viewID] },
    actions: { ...state.actions }
  };
};

export default connect(mapStateToProps)(MultilineControl);
