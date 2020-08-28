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

  const [seriesArray, setSeriesArray] = useState([]);
  const [activeTab, setActiveTab] = useState('tab-series');

  const plotContainer = useRef(null);
  const controlsVisibleHeight = 150;
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
            series={props.seriesOptions}
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

const mapStateToProps = state => {
  return {
    ...state
  };
};

export default connect(mapStateToProps)(StatisticsControl);
