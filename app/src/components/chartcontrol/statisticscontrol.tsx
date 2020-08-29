import React, { useState, useRef, useEffect } from 'react';
import connect from '../../connect';

import MultiSeries from '../multiseries'; // can't destructure for some reason
import { getSeries } from '../sql';
import { Statistics } from '../charts/statistics';
import { ViewWrapper } from '../viewwrapper';
import { ControlsWrapper } from '../controlswrapper';
import { ControlsContent } from '../controlscontent';

import { CopySave } from '../copysave';

const StatisticsControl = props => {
  const [isLoading, setIsLoading] = useState(false);

  const plotContainer = useRef(null);

  const { viewID } = props;
  const { containerDims, files, units } = props.session;
  const { seriesOptions } = props.views[viewID];
  const { selectedSeries } = props.views[viewID];
  const optionArray = Object.keys(seriesOptions);

  const controlsVisibleHeight = 150;
  const controlsHiddenHeight = 50;
  const [controlsHeight, setControlsHeight] = useState(controlsVisibleHeight);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [plotDims, setPlotDims] = useState({ width: 0, height: 0 });
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

  const handleSeriesSelect = (e, v) => {
    let arrayClone = [...selectedSeries];
    let newkeys = v.map(tag => seriesOptions[tag]);
    let existingkeys = arrayClone.map(d => d[0].key);

    let toremove = [];
    existingkeys.forEach(existkey => {
      if (!newkeys.includes(existkey)) {
        toremove.push(existkey);
      }
    });

    arrayClone = arrayClone.filter(d => !toremove.includes(d[0].key));
    if (toremove.length >= 1) {
      props.actions.changeSelectedSeries(arrayClone, viewID);
    }

    newkeys.forEach(key => {
      if (!existingkeys.includes(key)) {
        setIsLoading(true);
        getSeries(key).then(d => {
          let newarray = [...arrayClone, d];
          props.actions.changeSelectedSeries(newarray, viewID);
          setIsLoading(false);
        });
      }
    });
  };

  return (
    <>
      <ViewWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <Statistics units={units} seriesArray={selectedSeries} files={files} />
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
            seriesCallback={handleSeriesSelect}
            series={optionArray}
          />
        </ControlsContent>
        <ControlsContent tag="tab-export" tabname="Export">
          <CopySave
            array={selectedSeries}
            arraytype="multi"
            units={units}
            files={files}
          ></CopySave>
        </ControlsContent>
      </ControlsWrapper>
    </>
  );
};

const mapStateToProps = state => {
  return {
    ...state
  };
};

export default connect(mapStateToProps)(StatisticsControl);
