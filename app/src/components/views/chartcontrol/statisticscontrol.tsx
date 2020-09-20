import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'src/store';
import { getSeries } from 'src/sql';
import { Statistics } from './charts/statistics';
import { ChartWrapper } from './chartwrapper';

import {
  ControlsWrapper,
  ControlsContent,
  MultiSeriesSelect,
  CopySave
} from './controls';

const StatisticsControl = props => {
  const plotContainer = useRef(null);

  const { viewID } = props;

  const {
    seriesOptions,
    isLoading,
    loadedObj,
    selectedSeries,
    selectedSeriesLabel
  } = props.view;

  const optionArray = Object.keys(seriesOptions);
  const seriesData = Object.values(loadedObj);

  const { containerDims, files, units, isLoadingFromFile } = props.session;

  const controlsVisibleHeight = 200;
  const controlsHiddenHeight = 100;
  const [controlsHeight, setControlsHeight] = useState(controlsVisibleHeight);
  const [controlsVisible, setControlsVisible] = useState(true);

  const plotDims = {
    width: Math.max(containerDims.width, 200),
    height: Math.max(containerDims.height - controlsHeight, 200)
  };

  const [activeTab, setActiveTab] = useState('tab-series');

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

  useEffect(() => {
    if (isLoadingFromFile) {
      try {
        seriesLoad(selectedSeries, [], selectedSeriesLabel, viewID);
      } catch {
        console.warn('loading error', selectedSeries);
      }
    }
  }, [isLoadingFromFile]);

  const handleSeriesSelect = (e, v) => {
    let newkeys = v.map(d => seriesOptions[d]);
    let existingkeys = selectedSeries;
    let labels = v;
    seriesLoad(newkeys, existingkeys, labels, viewID);
  };
  return (
    <>
      <ChartWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <Statistics
          plotDims={plotDims}
          units={units}
          seriesArray={seriesData}
          files={files}
        />
      </ChartWrapper>
      <ControlsWrapper
        // disableCollapse={true}
        height={controlsHeight}
        activetab={activeTab}
        tabChangeCallback={handleTabChange}
        isVisible={controlsVisible}
        toggleHideCallback={toggleHideControlsTabs}
      >
        <ControlsContent tag="tab-series" tabname="Series Select">
          <MultiSeriesSelect
            value={selectedSeriesLabel}
            seriesCallback={handleSeriesSelect}
            series={optionArray}
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

export default connect(mapStateToProps)(StatisticsControl);
