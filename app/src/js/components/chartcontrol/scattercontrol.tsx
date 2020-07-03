import React, { useState, useEffect, useRef, useStyles } from 'react';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { Scatter } from '../charts/scatter';
import { getBBSize } from '../plotdimensions';
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
  const [plotdims, setPlotdims] = useState({ width: 50, height: 50 });
  const plotContainer = useRef(null);

  const domainPad = 0.05;

  const getMaxMin = series => {
    const valkey = props.units == 'ip' ? 'value_ip' : 'value_si';
    let min = Math.min(...series.map(d => d[valkey]));
    let max = Math.max(...series.map(d => d[valkey]));
    let pad = (max - min) * domainPad;
    min = min == 0 ? min : min - pad;
    max = max + pad;
    return [min, max];
  };

  useEffect(() => {
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(
        () => setPlotdims(getBBSize(plotContainer)),
        250
      );
    }
    let resizeTimer;
    window.addEventListener('resize', handleResize);
    setPlotdims(getBBSize(plotContainer));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          plotdims={plotdims}
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
      <ControlsWrapper>
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
