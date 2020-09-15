import React, { useState, useRef, useEffect } from 'react';
import connect from '../../store/connect';

import MultiSeries from '../multiseries'; // can't destructure for some reason
import { getSeries } from '../sql';
import { Statistics } from '../charts/statistics';
import { ViewWrapper } from '../viewwrapper';
import { ControlsWrapper } from '../controlswrapper';
import { ControlsContent } from '../controlscontent';

import { CopySave } from '../copysave';

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

  const controlsVisibleHeight = 150;
  const controlsHiddenHeight = 50;
  const [controlsHeight, setControlsHeight] = useState(controlsVisibleHeight);
  const [controlsVisible, setControlsVisible] = useState(true);

  const minHeight = 200;
  const minWidth = 200;

  const [plotDims, setPlotDims] = useState({
    width: minWidth,
    height: minHeight
  });

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

  useEffect(() => {
    setPlotDims({
      width: containerDims.width,
      height: Math.max(containerDims.height - controlsHeight - 20, 50)
    });
  }, [containerDims, controlsHeight]);

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
      <ViewWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <Statistics units={units} seriesArray={seriesData} files={files} />
      </ViewWrapper>
      <ControlsWrapper
        disableCollapse={true}
        height={controlsHeight}
        activetab={activeTab}
        tabChangeCallback={handleTabChange}
        isVisible={controlsVisible}
        toggleHideCallback={toggleHideControlsTabs}
      >
        <ControlsContent tag="tab-series" tabname="Series Select">
          <MultiSeries
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
