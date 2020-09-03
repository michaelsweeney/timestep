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
  const [isLoading, setIsLoading] = useState(false);

  const plotContainer = useRef(null);

  const { viewID } = props;
  const { containerDims, files, units } = props.session;
  const { seriesOptions } = props.views[viewID];
  const { selectedSeries, selectedSeriesLabel } = props.views[viewID];
  const optionArray = Object.keys(seriesOptions);

  const [seriesData, setSeriesData] = useState([]);

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
  const [plotDims, setPlotDims] = useState({ width: 0, height: 0 });
  '';
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
      width: containerDims.width,
      height: Math.max(containerDims.height - controlsHeight - 20, 50)
    });
  }, [props.dims, controlsHeight]);

  const handleSeriesSelect = (e, v) => {
    props.actions.changeSelectedSeriesLabel(v, viewID);
    props.actions.changeSelectedSeries(seriesOptions[v], viewID);
  };
  useEffect(() => {
    if (selectedSeries.length != 0) {
      setIsLoading(true);

      getSeries(selectedSeries).then(d => {
        setSeriesData(d);
        const getMaxMin = series => {
          const valkey = props.units == 'ip' ? 'value_ip' : 'value_si';
          let min = Math.min(...series.map(d => d[valkey]));
          let max = Math.max(...series.map(d => d[valkey]));
          return [min, max];
        };
        let [min, max] = getMaxMin(d);
        setMinRange(min);
        setMaxRange(max);
        setMinData(min);
        setMaxData(max);
        setIsLoading(false);
      });
    }
  }, [selectedSeries, units]);

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
          <CopySave
            array={selectedSeries}
            arraytype="single"
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

export default connect(mapStateToProps)(HistogramControl);
