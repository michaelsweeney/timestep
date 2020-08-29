import React, { useState, useEffect, useRef, useStyles } from 'react';
import connect from '../../connect';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sql';
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

  const plotContainer = useRef(null);

  const { viewID } = props;
  const { containerDims, files, units } = props.session;
  const { seriesOptions } = props.views[viewID];
  const { selectedSeries } = props.views[viewID];

  const xSeries = selectedSeries.X || [];
  const ySeries = selectedSeries.Y || [];
  const zSeries = selectedSeries.Z || [];

  const optionArray = Object.keys(seriesOptions);

  // x state
  const [xMinRange, setXMinRange] = useState(0);
  const [xMaxRange, setXMaxRange] = useState(1);

  // y state
  const [yMinRange, setYMinRange] = useState(0);
  const [yMaxRange, setYMaxRange] = useState(1);

  // z state
  const [zMinRange, setZMinRange] = useState(0);
  const [zMaxRange, setZMaxRange] = useState(1);
  const [zMinData, setZMinData] = useState(0);
  const [zMaxData, setZMaxData] = useState(1);

  const [reverseColor, setReverseColor] = useState(false);
  const [colorfunc, setColorfunc] = useState('interpolateViridis');

  const [activeTab, setActiveTab] = useState('tab-series');

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
      width: containerDims.width,
      height: Math.max(containerDims.height - controlsHeight - 20, 50)
    });
  }, [containerDims, controlsHeight]);

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
    getSeries(seriesOptions[v]).then(d => {
      props.actions.changeSelectedSeries(
        {
          X: d,
          Y: ySeries,
          Z: zSeries
        },
        viewID
      );
      let [min, max] = getMaxMin(d);
      setXMinRange(min);
      setXMaxRange(max);
      setIsLoadingX(false);
    });
  };

  const handleYSeriesSelect = (e, v) => {
    setIsLoadingY(true);
    getSeries(seriesOptions[v]).then(d => {
      props.actions.changeSelectedSeries(
        {
          X: xSeries,
          Y: d,
          Z: zSeries
        },
        viewID
      );
      let [min, max] = getMaxMin(d);
      setYMinRange(min);
      setYMaxRange(max);
      setIsLoadingY(false);
    });
  };

  const handleZSeriesSelect = (e, v) => {
    setIsLoadingZ(true);

    getSeries(seriesOptions[v]).then(d => {
      props.actions.changeSelectedSeries(
        {
          X: xSeries,
          Y: ySeries,
          Z: d
        },
        viewID
      );
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
          files={files}
          units={units}
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
            series={optionArray}
            title={'Select X Series'}
          />
          <SeriesSelect
            seriesCallback={handleYSeriesSelect}
            series={optionArray}
            title={'Select Y Series'}
          />
          <SeriesSelect
            seriesCallback={handleZSeriesSelect}
            series={optionArray}
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

export default connect(mapStateToProps)(ScatterControl);
