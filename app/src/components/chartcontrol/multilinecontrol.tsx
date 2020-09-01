import React, { useState, useEffect, useRef } from 'react';
import connect from '../../connect';

import MultiSeries from '../multiseries'; // can't destructure for some reason
import { getSeries } from '../sql';

import MultiLineLegend from './multilinelegend';
import { ColorCategorySelect } from '../colorcategoryselect';
import { MultiLine } from '../charts/multiline';
import { ViewWrapper } from '../viewwrapper';
import { ControlsWrapper } from '../controlswrapper';
import { ControlsContent } from '../controlscontent';
import { CopySave } from '../copysave';

const MultiLineControl = props => {
  const [isLoading, setIsLoading] = useState(false);

  const plotContainer = useRef(null);

  const { viewID } = props;
  const [seriesData, setSeriesData] = useState([]);

  const { containerDims, files, units } = props.session;
  const { seriesOptions } = props.views[viewID];
  const { selectedSeries } = props.views[viewID];
  const optionArray = Object.keys(seriesOptions);

  const [colorScheme, setColorScheme] = useState('schemeTableau10');
  const [seriesConfig, setSeriesConfig] = useState([]);
  const [activeTab, setActiveTab] = useState('tab-series');
  const [zoomDomain, setZoomDomain] = useState([]);

  const getControlsVisibleHeight = () =>
    200 + Math.max(seriesConfig.length - 3, 0) * 30;
  const controlsHiddenHeight = 50;
  const [controlsHeight, setControlsHeight] = useState(
    getControlsVisibleHeight()
  );
  const [controlsVisible, setControlsVisible] = useState(true);
  const [plotDims, setPlotDims] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    setPlotDims({
      width: containerDims.width,
      height: Math.max(containerDims.height - controlsHeight - 20, 50)
    });
  }, [containerDims, controlsHeight]);

  const handleColorCategoryChange = e => {
    setColorScheme(e);
  };

  const handleSeriesSelect = (e, v) => {
    let keys = v.map(d => seriesOptions[d]);
    props.actions.changeSelectedSeries(keys, viewID);
  };

  useEffect(() => {
    let arrayClone = [...seriesData];
    let newkeys = selectedSeries;
    let existingkeys = arrayClone.map(d => d[0].key);

    let toremove = [];
    existingkeys.forEach(existkey => {
      if (!newkeys.includes(existkey)) {
        toremove.push(existkey);
      }
    });

    if (toremove.length > 0) {
      arrayClone = arrayClone.filter(d => !toremove.includes(d[0].key));
      setSeriesData(arrayClone);
    } else {
      newkeys.forEach(key => {
        if (!existingkeys.includes(key)) {
          setIsLoading(true);
          getSeries(key).then(d => {
            let newarray = [...arrayClone, d];
            setSeriesData(newarray);
            setIsLoading(false);
          });
        }
      });
    }
  }, [selectedSeries]);

  const handleLegendChange = v => {
    setSeriesConfig(v);
  };

  const handleSelectClose = () => {
    // setActiveTab('tab-legend');
    setControlsHeight(getControlsVisibleHeight());
  };

  const handleZoomChange = domain => {
    setZoomDomain(domain);
  };

  return (
    <>
      <ViewWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <MultiLine
          zoomCallback={handleZoomChange}
          zoomDomain={zoomDomain}
          files={files}
          plotdims={plotDims}
          seriesConfig={seriesConfig}
          units={units}
          seriesArray={seriesData}
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
            series={optionArray}
          />
        </ControlsContent>

        <ControlsContent tag="tab-legend" tabname="Legend">
          <MultiLineLegend
            files={files}
            legendCallback={handleLegendChange}
            seriesArray={seriesData}
            colorScheme={colorScheme}
            units={units}
          />
        </ControlsContent>
        <ControlsContent tag="tab-options" tabname="Options">
          <ColorCategorySelect
            colorCategoryCallback={handleColorCategoryChange}
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

export default connect(mapStateToProps)(MultiLineControl);
