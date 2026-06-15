import React, { useState, useEffect, useRef, useMemo } from 'react';
import { connect } from 'src/store';
import { getPlotDims } from './plotdims';

import { getSeries, getSeriesKeys } from 'src/sql';

import { MultilineCanvas } from './charts/multilinecanvas';

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

  // Cross-pane linking: a linked pane both broadcasts the time its cursor is
  // over and honors hovers from other linked panes (the canvas draws the
  // crosshair from these). hoverSource lets the canvas ignore the echo of its
  // own hover.
  const viewLinked = props.view.linked !== false;
  const { hoverTime, hoverSource } = props.linked;

  const { files, units, isLoadingFromFile } = props.session;
  const { paneDims, forcedTab, onForcedTabHandled } = props;

  const {
    seriesOptions,
    isLoading,
    loadedObj,
    selectedSeries,
    selectedSeriesLabel
  } = props.view;

  const optionArray = Object.keys(seriesOptions);
  // Stable reference unless the loaded data actually changes. Without this a
  // fresh array every render retriggers the chart's build effect — and a hover
  // dispatch (linked crosshair) would rebuild the chart mid-hover, wiping the
  // cursor the source pane just drew.
  const seriesData = useMemo(() => Object.values(loadedObj), [loadedObj]);

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

  // Pane-header Options/Export buttons request a tab; open it + reveal controls.
  useEffect(() => {
    if (!forcedTab) return;
    setActiveTab(forcedTab);
    setControlsVisible(true);
    setControlsHeight(getControlsVisibleHeight());
    onForcedTabHandled && onForcedTabHandled();
  }, [forcedTab]);

  const plotDims = getPlotDims(paneDims, controlsHeight);

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
        <MultilineCanvas
          zoomCallback={handleZoomChange}
          zoomDomain={zoomDomain}
          files={files}
          plotdims={plotDims}
          seriesConfig={seriesConfig}
          units={units}
          seriesArray={seriesData}
          viewID={viewID}
          hoverTime={viewLinked ? hoverTime : null}
          hoverSource={viewLinked ? hoverSource : null}
          onHoverMove={
            viewLinked ? t => props.actions.setHoverTime(t, viewID) : undefined
          }
          onHoverEnd={
            viewLinked ? () => props.actions.clearHoverTime() : undefined
          }
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
    linked: { ...state.linked },
    actions: { ...state.actions }
  };
};

export default connect(mapStateToProps)(MultilineControl);
