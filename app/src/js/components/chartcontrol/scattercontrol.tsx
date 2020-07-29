import React, { useState, useEffect, useRef, useStyles } from 'react';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { Scatter } from '../charts/scatter';
import { ViewWrapper } from '../viewwrapper';
import { ControlsWrapper } from '../controlswrapper';
import { ControlsContent } from '../controlscontent';

import { ColorControl } from '../colorcontrol';
import { CopySave } from '../copysave';

const ScatterControl = props => {
  const [isLoadingX, setIsLoadingX] = useState(false);
  const [isLoadingY, setIsLoadingY] = useState(false);
  const [isLoadingZ, setIsLoadingZ] = useState(false);

  // x state
  const [xSeries, setXSeries] = useState([]);
  const [xMinRange, setXMinRange] = useState(0);
  const [xMaxRange, setXMaxRange] = useState(1);

  // y state
  const [ySeries, setYSeries] = useState([]);
  const [yMinRange, setYMinRange] = useState(0);
  const [yMaxRange, setYMaxRange] = useState(1);

  // z state
  const [zSeries, setZSeries] = useState([]);
  const [zMinRange, setZMinRange] = useState(0);
  const [zMaxRange, setZMaxRange] = useState(1);
  const [zMinData, setZMinData] = useState(0);
  const [zMaxData, setZMaxData] = useState(1);

  const [reverseColor, setReverseColor] = useState(false);
  const [colorfunc, setColorfunc] = useState('interpolateViridis');

  const [activeTab, setActiveTab] = useState('tab-series');

  const plotContainer = useRef(null);
  const controlsVisibleHeight = 275;
  const controlsHiddenHeight = 50;
  const [controlsHeight, setControlsHeight] = useState(controlsVisibleHeight);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [plotDims, setPlotDims] = useState({ width: 0, height: 0 });

  const domainPad = 0.05;

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

  const getMaxMin = series => {
    const valkey = props.units == 'ip' ? 'value_ip' : 'value_si';
    let min = Math.min(...series.map(d => d[valkey]));
    let max = Math.max(...series.map(d => d[valkey]));
    let pad = (max - min) * domainPad;
    min = min == 0 ? min : min - pad;
    max = max + pad;
    return [min, max];
  };

  const handleXSeriesSelect = (e, v) => {
    setIsLoadingX(true);
    getSeries(props.seriesLookupObj[v], props.units).then(d => {
      setXSeries(d);
      let [min, max] = getMaxMin(d);
      setXMinRange(min);
      setXMaxRange(max);
      setIsLoadingX(false);
    });
  };

  const handleYSeriesSelect = (e, v) => {
    setIsLoadingY(true);
    getSeries(props.seriesLookupObj[v], props.units).then(d => {
      setYSeries(d);
      let [min, max] = getMaxMin(d);
      setYMinRange(min);
      setYMaxRange(max);
      setIsLoadingY(false);
    });
  };

  const handleZSeriesSelect = (e, v) => {
    setIsLoadingZ(true);

    getSeries(props.seriesLookupObj[v], props.units).then(d => {
      setZSeries(d);
      let [min, max] = getMaxMin(d);
      setZMinRange(min);
      setZMaxRange(max);
      setZMinData(min);
      setZMaxData(max);
      setIsLoadingZ(false);
    });
  };

  const handleColorRangeChange = v => {
    setZMinRange(v[0]);
    setZMaxRange(v[1]);
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
      <ViewWrapper
        plotContainer={plotContainer}
        isLoading={isLoadingX || isLoadingY || isLoadingZ ? true : false}
      >
        <Scatter
          plotdims={plotDims}
          files={props.files}
          units={props.units}
          colorfunc={colorfunc}
          reversecolor={reverseColor}
          xseries={xSeries}
          xminrange={xMinRange}
          xmaxrange={xMaxRange}
          yseries={ySeries}
          yminrange={yMinRange}
          ymaxrange={yMaxRange}
          zseries={zSeries}
          zminrange={zMinRange}
          zmaxrange={zMaxRange}
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
          <SeriesSelect
            seriesCallback={handleXSeriesSelect}
            series={props.seriesOptions}
            title={'Select X Series'}
          />
          <SeriesSelect
            seriesCallback={handleYSeriesSelect}
            series={props.seriesOptions}
            title={'Select Y Series'}
          />
          <SeriesSelect
            seriesCallback={handleZSeriesSelect}
            series={props.seriesOptions}
            title={'Select Color Series'}
          />
        </ControlsContent>

        <ControlsContent tag="tab-options" tabname="Options">
          <ColorControl
            defaultRange={[zMinData, zMaxData]}
            colorScaleCallback={handleColorScaleChange}
            reverseCallback={handleReverseColorScale}
            rangeCallback={handleColorRangeChange}
          />
        </ControlsContent>

        <ControlsContent tag="tab-export" tabname="Export">
          <CopySave
            array={[xSeries, ySeries, zSeries]}
            arraytype="scatter"
            units={props.units}
            files={props.files}
          ></CopySave>
        </ControlsContent>
      </ControlsWrapper>
    </>
  );
};

export { ScatterControl };
