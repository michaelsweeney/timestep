import React, { useState, useEffect } from 'react';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { Heatmap } from './heatmap';
import { ColorScaleSelect } from '../colorscaleselect';
import { CheckboxInput } from '../checkboxinput';
import { RangeSlider } from '../rangeslider';

const HeatmapControl = props => {
  const [series, setSeries] = useState([]);
  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [minData, setMinData] = useState(0);
  const [maxData, setMaxData] = useState(0);
  const [reverseColor, setReverseColor] = useState(false);
  const [colorscale, setColorscale] = useState('interpolateViridis');

  const handleSeriesSelect = (e, v) => {
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
    });
  };

  const handleRangeChange = v => {
    setMinRange(v[0]);
    setMaxRange(v[1]);
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
      <Heatmap
        series={series}
        units={props.units}
        colorscale={colorscale}
        minrange={minRange}
        maxrange={maxRange}
        reversecolor={reverseColor}
      ></Heatmap>
      <div className="heatmap-controls-container">
        <SeriesSelect
          seriesCallback={handleSeriesSelect}
          series={props.seriesOptions}
        />
        <ColorScaleSelect colorScaleCallback={handleColorScaleChange} />

        <CheckboxInput
          title="Reverse Colorscale"
          callback={handleReverseColorScale}
        ></CheckboxInput>

        <div className="range-container">
          <RangeSlider
            title={'Colorscale Range'}
            defaultValue={[minData, maxData]}
            rangeCallback={handleRangeChange}
          ></RangeSlider>
        </div>
      </div>
    </div>
  );
};

export { HeatmapControl };
