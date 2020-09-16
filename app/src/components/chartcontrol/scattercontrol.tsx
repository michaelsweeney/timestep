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
  const { containerDims, files, units, isLoadingFromFile } = props.session;
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

  useEffect(() => {
    let [xmin, xmax] =
      xSeriesData.length != 0 ? getMaxMin(xSeriesData) : [0, 1];
    let [ymin, ymax] =
      ySeriesData.length != 0 ? getMaxMin(ySeriesData) : [0, 1];
    let [zmin, zmax] =
      zSeriesData.length != 0 ? getMaxMin(zSeriesData) : [0, 1];
    setXMinRange(xmin);
    setXMaxRange(xmax);
    setYMinRange(ymin);
    setYMaxRange(ymax);
    setZMinRange(zmin);
    setZMaxRange(zmax);
  }, [units]);

  const seriesLoad = (key, label, viewID, dimension) => {
    const dim = dimension.toUpperCase();

    console.log(dim);
    const selectedSeriesObj = {
      X: selectedXSeries,
      Y: selectedYSeries,
      Z: selectedZSeries
    };
    selectedSeriesObj[dim] = key;
    props.actions.changeSelectedSeries(selectedSeriesObj, viewID);

    const selectedSeriesLabelObj = {
      X: selectedXSeriesLabel,
      Y: selectedYSeriesLabel,
      Z: selectedZSeriesLabel
    };
    selectedSeriesLabelObj[dim] = label;
    props.actions.changeSelectedSeriesLabel(selectedSeriesLabelObj, viewID);
    props.actions.addKeyToQueue(dim, viewID);
    getSeries(key).then(d => {
      props.actions.addToLoadedArray(dim, d, viewID);
      props.actions.removeKeyFromQueue(dim, viewID);
      let [min, max] = getMaxMin(d);

      if (dim == 'X') {
        setXMinRange(min);
        setXMaxRange(max);
      }
      if (dim == 'Y') {
        setYMinRange(min);
        setYMaxRange(max);
      }
      if (dim == 'Z') {
        setZMinRange(min);
        setZMaxRange(max);
      }
    });
  };

  useEffect(() => {
    if (isLoadingFromFile) {
      try {
        seriesLoad(selectedXSeries, selectedXSeriesLabel, viewID, 'X');
        seriesLoad(selectedYSeries, selectedYSeriesLabel, viewID, 'Y');
        seriesLoad(selectedZSeries, selectedZSeriesLabel, viewID, 'Z');
      } catch {
        console.warn('loading error', selectedSeries);
      }
    }
  }, [isLoadingFromFile]);

  const handleXSeriesSelect = (e, v) => {
    const key = seriesOptions[v];
    const label = v;
    seriesLoad(key, label, viewID, 'X');
  };

  const handleYSeriesSelect = (e, v) => {
    const key = seriesOptions[v];
    const label = v;
    seriesLoad(key, label, viewID, 'Y');
  };

  const handleZSeriesSelect = (e, v) => {
    const key = seriesOptions[v];
    const label = v;
    seriesLoad(key, label, viewID, 'Z');
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
          <CopySave viewID={viewID} arraytype="scatter"></CopySave>
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
