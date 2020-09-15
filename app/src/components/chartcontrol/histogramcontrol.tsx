import React, { useState, useEffect, useRef } from 'react';
import connect from '../../store/connect';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sql';
import { Histogram } from '../charts/histogram';

import { ViewWrapper } from '../viewwrapper';
import { ControlsWrapper } from '../controlswrapper';
import { ControlsContent } from '../controlscontent';
import { BinControl } from '../bincontrol';
import { CopySave } from '../copysave';

const HistogramControl = props => {
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

  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [minData, setMinData] = useState(0);
  const [maxData, setMaxData] = useState(1);
  const [numBins, setNumBins] = useState(20);

  const [activeTab, setActiveTab] = useState('tab-series');

  const controlsVisibleHeight = 200;
  const controlsHiddenHeight = 50;
  const [controlsHeight, setControlsHeight] = useState(controlsVisibleHeight);
  const [controlsVisible, setControlsVisible] = useState(true);

  const minHeight = 200;
  const minWidth = 200;

  const [plotDims, setPlotDims] = useState({
    width: minWidth,
    height: minHeight
  });
  const handleControlsHeightChange = height => {
    setControlsHeight(height);
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

  useEffect(() => {
    setPlotDims({
      width: Math.max(containerDims.width, minWidth),
      height: Math.max(containerDims.height - controlsHeight - 20, minHeight)
    });
  }, [containerDims, controlsHeight]);

  const getMaxMin = series => {
    const valkey = units == 'ip' ? 'value_ip' : 'value_si';
    let min = Math.min(...series.map(d => d[valkey]));
    let max = Math.max(...series.map(d => d[valkey]));
    return [min, max];
  };

  useEffect(() => {
    let [min, max] = getMaxMin(seriesData);
    setMinRange(min);
    setMaxRange(max);
    setMinData(min);
    setMaxData(max);
  }, [units]);

  const seriesLoad = (key, label, viewID) => {
    props.actions.changeSelectedSeriesLabel(label, viewID);
    props.actions.changeSelectedSeries(key, viewID);
    props.actions.addKeyToQueue(key, viewID);
    getSeries(key).then(d => {
      props.actions.addToLoadedArray(key, d, viewID);
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

  let numbins = 10;

  const handleRangeChange = v => {
    setMinRange(v[0]);
    setMaxRange(v[1]);
  };

  const handleNumBinChange = v => {
    setNumBins(v);
  };

  return (
    <>
      <ViewWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <Histogram
          files={files}
          plotdims={plotDims}
          series={seriesData}
          units={units}
          binmin={minRange}
          binmax={maxRange}
          numbins={numBins}
        ></Histogram>
      </ViewWrapper>
      <ControlsWrapper
        height={controlsHeight}
        activetab={activeTab}
        tabChangeCallback={handleTabChange}
        isVisible={controlsVisible}
        toggleHideCallback={toggleHideControlsTabs}
        controlsHeightCallback={handleControlsHeightChange}
      >
        <ControlsContent tag="tab-series" tabname="Series Select">
          <SeriesSelect
            value={selectedSeriesLabel}
            seriesCallback={handleSeriesSelect}
            series={optionArray}
          />
        </ControlsContent>
        <ControlsContent tag="tab-options" tabname="Options">
          <BinControl
            rangeCallback={handleRangeChange}
            binCallback={handleNumBinChange}
            defaultRange={[minData, maxData]}
            numBins={numBins}
          ></BinControl>
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

export default connect(mapStateToProps)(HistogramControl);
