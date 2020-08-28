import React, { useState, useEffect, useRef } from 'react';
import connect from '../../connect';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sql';

import { Heatmap } from '../charts/heatmap';

import { ViewWrapper } from '../viewwrapper';
import { ControlsWrapper } from '../controlswrapper';
import { ControlsContent } from '../controlscontent';

import { ColorControl } from '../colorcontrol';
import { CopySave } from '../copysave';

const HeatmapControl = props => {
  const [isLoading, setIsLoading] = useState(false);
  const [series, setSeries] = useState([]);
  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [minData, setMinData] = useState(0);
  const [maxData, setMaxData] = useState(0);
  const [reverseColor, setReverseColor] = useState(false);
  const [colorfunc, setColorfunc] = useState('interpolateViridis');
  const [activeTab, setActiveTab] = useState('tab-series');

  const plotContainer = useRef(null);
  const controlsVisibleHeight = 200;
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
    setIsLoading(true);
    getSeries(props.seriesLookupObj[v], props.units).then(d => {
      setSeries(d);

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
  };

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
      <ViewWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <Heatmap
          plotdims={plotDims}
          files={props.files}
          series={series}
          units={props.units}
          colorfunc={colorfunc}
          minrange={minRange}
          maxrange={maxRange}
          reversecolor={reverseColor}
        ></Heatmap>
      </ViewWrapper>
      <ControlsWrapper
        height={controlsHeight}
        activetab={activeTab}
        tabChangeCallback={handleTabChange}
        isVisible={controlsVisible}
        toggleHideCallback={toggleHideControlsTabs}
      >
        <ControlsContent tag="tab-series" tabname="Series Select">
          <SeriesSelect
            seriesCallback={handleSeriesSelect}
            series={props.seriesOptions}
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
          <CopySave
            array={series}
            arraytype="single"
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

export default connect(mapStateToProps)(HeatmapControl);
