import React, { useState, useEffect, useRef, useStyles } from 'react';
import connect from '../../store/connect';

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
  const { selectedSeries, selectedSeriesLabel } = props.views[viewID];

  const selectedXSeries = selectedSeries.X || [];
  const selectedYSeries = selectedSeries.Y || [];
  const selectedZSeries = selectedSeries.Z || [];

  const selectedXSeriesLabel = selectedSeriesLabel
    ? selectedSeriesLabel.X
    : null;
  const selectedYSeriesLabel = selectedSeriesLabel
    ? selectedSeriesLabel.Y
    : null;
  const selectedZSeriesLabel = selectedSeriesLabel
    ? selectedSeriesLabel.Z
    : null;

  const [xSeriesData, setXSeriesData] = useState([]);
  const [ySeriesData, setYSeriesData] = useState([]);
  const [zSeriesData, setZSeriesData] = useState([]);

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

  // x series handler
  useEffect(() => {
    if (selectedXSeries.length != 0) {
      setIsLoadingX(true);
      getSeries(selectedXSeries).then(d => {
        setXSeriesData(d);
        let [min, max] = getMaxMin(d);
        setXMinRange(min);
        setXMaxRange(max);
        setIsLoadingX(false);
      });
    }
  }, [selectedXSeries, units]);

  const handleXSeriesSelect = (e, v) => {
    props.actions.changeSelectedSeries(
      {
        X: seriesOptions[v],
        Y: selectedYSeries,
        Z: selectedZSeries
      },
      viewID
    );
    props.actions.changeSelectedSeriesLabel(
      {
        X: v,
        Y: selectedYSeriesLabel,
        Z: selectedZSeriesLabel
      },
      viewID
    );
  };

  // y series handler
  useEffect(() => {
    if (selectedYSeries.length != 0) {
      setIsLoadingY(true);
      getSeries(selectedSeries.Y).then(d => {
        setYSeriesData(d);
        let [min, max] = getMaxMin(d);
        setYMinRange(min);
        setYMaxRange(max);
        setIsLoadingY(false);
      });
    }
  }, [selectedYSeries, units]);

  const handleYSeriesSelect = (e, v) => {
    props.actions.changeSelectedSeries(
      {
        X: selectedXSeries,
        Y: seriesOptions[v],
        Z: selectedZSeries
      },
      viewID
    );
    props.actions.changeSelectedSeriesLabel(
      {
        X: selectedXSeriesLabel,
        Y: v,
        Z: selectedZSeriesLabel
      },
      viewID
    );
  };

  // z series handler
  useEffect(() => {
    if (selectedZSeries.length != 0) {
      setIsLoadingZ(true);
      getSeries(selectedZSeries).then(d => {
        setZSeriesData(d);
        let [min, max] = getMaxMin(d);
        setZMinRange(min);
        setZMaxRange(max);
        setZMinData(min);
        setZMaxData(max);
        setIsLoadingZ(false);
      });
    }
  }, [selectedZSeries, units]);

  const handleZSeriesSelect = (e, v) => {
    props.actions.changeSelectedSeries(
      {
        X: selectedXSeries,
        Y: selectedYSeries,
        Z: seriesOptions[v]
      },
      viewID
    );
    props.actions.changeSelectedSeriesLabel(
      {
        X: selectedXSeriesLabel,
        Y: selectedYSeriesLabel,
        Z: v
      },
      viewID
    );
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
          xseries={xSeriesData}
          xminrange={xMinRange}
          xmaxrange={xMaxRange}
          yseries={ySeriesData}
          yminrange={yMinRange}
          ymaxrange={yMaxRange}
          zseries={zSeriesData}
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
            value={selectedXSeriesLabel}
            seriesCallback={handleXSeriesSelect}
            series={optionArray}
            title={'Select X Series'}
          />
          <SeriesSelect
            value={selectedYSeriesLabel}
            seriesCallback={handleYSeriesSelect}
            series={optionArray}
            title={'Select Y Series'}
          />
          <SeriesSelect
            value={selectedZSeriesLabel}
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
            array={[xSeriesData, ySeriesData, zSeriesData]}
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
