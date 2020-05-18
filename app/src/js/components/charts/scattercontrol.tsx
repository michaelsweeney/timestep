import React, { useState, useEffect } from 'react';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { ColorScaleSelect } from '../colorscaleselect';
import { CheckboxInput } from '../checkboxinput';
import { RangeSlider } from '../rangeslider';
import { Scatter } from './scatter';

const ScatterControl = props => {
  // x state
  const [xSeries, setXSeries] = useState([]);
  const [xMinRange, setXMinRange] = useState(0);
  const [xMaxRange, setXMaxRange] = useState(1);
  const [xMinData, setXMinData] = useState(0);
  const [xMaxData, setXMaxData] = useState(1);

  // y state
  const [ySeries, setYSeries] = useState([]);
  const [yMinRange, setYMinRange] = useState(0);
  const [yMaxRange, setYMaxRange] = useState(1);
  const [yMinData, setYMinData] = useState(0);
  const [yMaxData, setYMaxData] = useState(1);

  // z state
  const [zSeries, setZSeries] = useState([]);
  const [zMinRange, setZMinRange] = useState(0);
  const [zMaxRange, setZMaxRange] = useState(1);
  const [zMinData, setZMinData] = useState(0);
  const [zMaxData, setZMaxData] = useState(1);

  const [reverseColor, setReverseColor] = useState(false);
  const [colorscale, setColorscale] = useState('interpolateViridis');

  const getMaxMin = series => {
    const valkey = props.units == 'ip' ? 'value_ip' : 'value_si';
    let min = Math.min(...series.map(d => d[valkey]));
    let max = Math.max(...series.map(d => d[valkey]));
    return [min, max];
  };

  const handleXSeriesSelect = (e, v) => {
    getSeries(props.seriesLookupObj[v], props.units).then(d => {
      setXSeries(d);
      let [min, max] = getMaxMin(d);
      setXMinRange(min);
      setXMaxRange(max);
      setXMinData(min);
      setXMaxData(max);
    });
  };

  const handleYSeriesSelect = (e, v) => {
    getSeries(props.seriesLookupObj[v], props.units).then(d => {
      setYSeries(d);
      let [min, max] = getMaxMin(d);
      setYMinRange(min);
      setYMaxRange(max);
      setYMinData(min);
      setYMaxData(max);
    });
  };

  const handleZSeriesSelect = (e, v) => {
    getSeries(props.seriesLookupObj[v], props.units).then(d => {
      setZSeries(d);
      let [min, max] = getMaxMin(d);
      setZMinRange(min);
      setZMaxRange(max);
      setZMinData(min);
      setZMaxData(max);
    });
  };

  const handleColorRangeChange = v => {
    setZMinRange(v[0]);
    setZMaxRange(v[1]);
  };

  const handleColorScaleChange = e => {
    setColorscale(e);
  };

  const handleReverseColorScale = e => {
    if (e.target.checked) {
      setReverseColor(true);
    } else {
      setReverseColor(false);
    }
  };

  return (
    <div>
      <Scatter
        units={props.units}
        colorscale={colorscale}
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
        <RangeSlider
          title={'Colorscale Range'}
          defaultValue={[zMinData, zMaxData]}
          rangeCallback={handleColorRangeChange}
        ></RangeSlider>
      </div>
    </div>
  );
};

export { ScatterControl };
