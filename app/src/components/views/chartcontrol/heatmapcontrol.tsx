import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'src/store';

import { getSeries } from 'src/sql';

import { Heatmap } from './charts/heatmap';
import { ChartWrapper } from './chartwrapper';

import {
  ControlsWrapper,
  ControlsContent,
  ColorControl,
  CopySave,
  SeriesSelect
} from './controls';

const HeatmapControl = props => {
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

  const seriesData = Object.values(loadedObj)[0] || [];
  const optionArray = Object.keys(seriesOptions);

  // local state

  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [minData, setMinData] = useState(0);
  const [maxData, setMaxData] = useState(0);
  const [reverseColor, setReverseColor] = useState(false);
  const [colorfunc, setColorfunc] = useState('interpolateViridis');
  const [activeTab, setActiveTab] = useState('tab-series');

  const controlsVisibleHeight = 225;
  const controlsHiddenHeight = 100;

  const [controlsHeight, setControlsHeight] = useState(controlsVisibleHeight);
  const [controlsVisible, setControlsVisible] = useState(true);

  const plotDims = {
    width: Math.max(containerDims.width, 200),
    height: Math.max(containerDims.height - controlsHeight, 200)
  };
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

  const getMaxMin = series => {
    const valkey = units == 'ip' ? 'value_ip' : 'value_si';
    let min = Math.min(...series.map(d => d[valkey]));
    let max = Math.max(...series.map(d => d[valkey]));
    return [min, max];
  };

  const seriesLoad = (key, label, viewID) => {
    props.actions.changeSelectedSeriesLabel(label, viewID);
    props.actions.changeSelectedSeries(key, viewID);
    props.actions.addKeyToQueue(key, viewID);
    getSeries(key).then(d => {
      props.actions.changeLoadedArray({ [key]: d }, viewID);
      props.actions.removeKeyFromQueue(key, viewID);
      props.actions.setLoadingFromFile(false);
      let [min, max] = getMaxMin(d);
      setMinRange(min);
      setMaxRange(max);
      setMinData(min);
      setMaxData(max);
    });
  };

  const handleSeriesSelect = (e, v) => {
    const selectedKey = seriesOptions[v];
    seriesLoad(selectedKey, v, viewID);
  };

  useEffect(() => {
    if (isLoadingFromFile) {
      try {
        seriesLoad(selectedSeries, selectedSeriesLabel, viewID);
      } catch {
        console.warn('loading error', selectedSeries);
      }
    }
  }, [isLoadingFromFile]);

  useEffect(() => {
    let [min, max] = getMaxMin(seriesData);
    setMinRange(min);
    setMaxRange(max);
    setMinData(min);
    setMaxData(max);
  }, [units]);

  const handleRangeChange = v => {
    setMinRange(v[0]);
    setMaxRange(v[1]);
  };

  const handleColorScaleChange = e => {
    setColorfunc(e);
  };

  const handleReverseColorScale = e => {
    if (e.target.checked) {
      setReverseColor(true);
    } else {
      setReverseColor(false);
    }
  };
  return (
    <>
      <ChartWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <Heatmap
          plotdims={plotDims}
          files={files}
          series={seriesData}
          units={units}
          colorfunc={colorfunc}
          minrange={minRange}
          maxrange={maxRange}
          reversecolor={reverseColor}
        ></Heatmap>
      </ChartWrapper>
      <ControlsWrapper
        height={controlsHeight}
        activetab={activeTab}
        tabChangeCallback={handleTabChange}
        isVisible={controlsVisible}
        toggleHideCallback={toggleHideControlsTabs}
      >
        <ControlsContent tag="tab-series" tabname="Series Select">
          <SeriesSelect
            value={selectedSeriesLabel}
            seriesCallback={handleSeriesSelect}
            series={optionArray}
          />
        </ControlsContent>
        <ControlsContent tag="tab-options" tabname="Options">
          <ColorControl
            defaultRange={[minData, maxData]}
            colorScaleCallback={handleColorScaleChange}
            reverseCallback={handleReverseColorScale}
            rangeCallback={handleRangeChange}
          />
        </ControlsContent>
        <ControlsContent tag="tab-export" tabname="Export">
          <CopySave viewID={viewID} arraytype="single"></CopySave>
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

export default connect(mapStateToProps)(HeatmapControl);
