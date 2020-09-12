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
  const plotContainer = useRef(null);

  const { viewID } = props;
  const { containerDims, files, units } = props.session;
  const {
    seriesOptions,
    isLoading,
    loadedObj,
    selectedSeries,
    selectedSeriesLabel
  } = props.view;

  const selectedXSeries = selectedSeries.X || null;
  const selectedYSeries = selectedSeries.Y || null;
  const selectedZSeries = selectedSeries.Z || null;

  const xSeriesData = loadedObj.X || [];
  const ySeriesData = loadedObj.Y || [];
  const zSeriesData = loadedObj.Z || [];

  const selectedXSeriesLabel = selectedSeriesLabel
    ? selectedSeriesLabel.X
    : null;
  const selectedYSeriesLabel = selectedSeriesLabel
    ? selectedSeriesLabel.Y
    : null;
  const selectedZSeriesLabel = selectedSeriesLabel
    ? selectedSeriesLabel.Z
    : null;

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

  const minHeight = 200;
  const minWidth = 200;

  const [plotDims, setPlotDims] = useState({
    width: minWidth,
    height: minHeight
  });
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
      width: Math.max(containerDims.width, minWidth),
      height: Math.max(containerDims.height - controlsHeight - 20, minHeight)
    });
  }, [containerDims, controlsHeight]);

  const getMaxMin = series => {
    const valkey = units == 'ip' ? 'value_ip' : 'value_si';
    let min = Math.min(...series.map(d => d[valkey]));
    let max = Math.max(...series.map(d => d[valkey]));
    let pad = (max - min) * domainPad;
    min = min == 0 ? min : min - pad;
    max = max + pad;
    return [min, max];
  };

  const handleXSeriesSelect = (e, v) => {
    const xKey = seriesOptions[v];
    props.actions.changeSelectedSeries(
      {
        X: xKey,
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
    props.actions.addKeyToQueue('X', viewID);
    getSeries(xKey).then(d => {
      props.actions.addToLoadedArray('X', d, viewID);
      props.actions.removeKeyFromQueue('X', viewID);
      let [min, max] = getMaxMin(d);
      setXMinRange(min);
      setXMaxRange(max);
    });
  };

  const handleYSeriesSelect = (e, v) => {
    const yKey = seriesOptions[v];
    props.actions.changeSelectedSeries(
      {
        X: selectedXSeries,
        Y: yKey,
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
    props.actions.addKeyToQueue('Y', viewID);
    getSeries(yKey).then(d => {
      props.actions.addToLoadedArray('Y', d, viewID);
      props.actions.removeKeyFromQueue('Y', viewID);
      let [min, max] = getMaxMin(d);
      setYMinRange(min);
      setYMaxRange(max);
    });
  };

  const handleZSeriesSelect = (e, v) => {
    const zKey = seriesOptions[v];
    props.actions.changeSelectedSeries(
      {
        X: selectedXSeries,
        Y: selectedYSeries,
        Z: zKey
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
    props.actions.addKeyToQueue('Z', viewID);
    getSeries(zKey).then(d => {
      props.actions.addToLoadedArray('Z', d, viewID);
      props.actions.removeKeyFromQueue('Z', viewID);
      let [min, max] = getMaxMin(d);
      setZMinRange(min);
      setZMaxRange(max);
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
        isLoading={isLoading ? true : false}
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

const mapStateToProps = (state, ownProps) => {
  return {
    session: { ...state.session },
    view: { ...state.views[ownProps.viewID] },
    actions: { ...state.actions }
  };
};

export default connect(mapStateToProps)(ScatterControl);
