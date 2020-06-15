import React, { useState, useEffect, useRef, useStyles } from 'react';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { ColorScaleSelect } from '../colorscaleselect';
import { ControlsContainer } from '../controlscontainer';
import { CheckboxInput } from '../checkboxinput';
import { RangeSlider } from '../rangeslider';
import { Scatter } from '../charts/scatter';
import { getBBSize } from '../plotdimensions';
import { ViewWrapper } from './viewwrapper';

const ScatterControl = props => {
  const [isLoadingX, setIsLoadingX] = useState(false);
  const [isLoadingY, setIsLoadingY] = useState(false);
  const [isLoadingZ, setIsLoadingZ] = useState(false);

  // x state
  const [xSeries, setXSeries] = useState([]);
  const [xMinRange, setXMinRange] = useState(0);
  const [xMaxRange, setXMaxRange] = useState(1);
  // const [xMinData, setXMinData] = useState(0);
  // const [xMaxData, setXMaxData] = useState(1);

  // y state
  const [ySeries, setYSeries] = useState([]);
  const [yMinRange, setYMinRange] = useState(0);
  const [yMaxRange, setYMaxRange] = useState(1);
  // const [yMinData, setYMinData] = useState(0);
  // const [yMaxData, setYMaxData] = useState(1);

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

  const getMaxMin = series => {
    const valkey = props.units == 'ip' ? 'value_ip' : 'value_si';
    let min = Math.min(...series.map(d => d[valkey]));
    let max = Math.max(...series.map(d => d[valkey]));
    return [min, max];
  };

  useEffect(() => {
    function handleResize() {
      setTimeout(() => setPlotdims(getBBSize(plotContainer)), 500);
    }
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
      // setXMinData(min);
      // setXMaxData(max);
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
      // setYMinData(min);
      // setYMaxData(max);
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

      <ControlsContainer tag="scatter-controls-container">
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

        <ColorScaleSelect colorScaleCallback={handleColorScaleChange} />

        <CheckboxInput
          title="Reverse Colorscale"
          callback={handleReverseColorScale}
        ></CheckboxInput>

        <div className="range-container">
          <div className="slider-wrapper">
            <RangeSlider
              title={'Colorscale Range'}
              defaultValue={[zMinData, zMaxData]}
              rangeCallback={handleColorRangeChange}
            ></RangeSlider>
          </div>
        </div>
      </ControlsContainer>
    </>
  );
};

export { ScatterControl };
