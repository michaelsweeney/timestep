import React, { useState, useEffect, useRef } from 'react';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { Histogram } from './histogram';
import { RangeSlider } from '../rangeslider';
import { SingleSlider } from '../singleslider';
import { getBBSize } from '../plotdimensions';

const HistogramControl = props => {
  const [series, setSeries] = useState([]);
  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [minData, setMinData] = useState(0);
  const [maxData, setMaxData] = useState(1);
  const [numBins, setNumBins] = useState(20);
  const [plotdims, setPlotdims] = useState({ width: 50, height: 50 });
  const plotContainer = useRef(null);

  useEffect(() => {
    function handleResize() {
      setTimeout(() => setPlotdims(getBBSize(plotContainer)), 500);
    }
    window.addEventListener('resize', handleResize);
    setPlotdims(getBBSize(plotContainer));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  let numbins = 10;

  const handleRangeChange = v => {
    setMinRange(v[0]);
    setMaxRange(v[1]);
  };

  const handleNumBinChange = v => {
    setNumBins(v);
  };

  return (
    <React.Fragment>
      <div ref={plotContainer}>
        <Histogram
          plotdims={plotdims}
          series={series}
          units={props.units}
          binmin={minRange}
          binmax={maxRange}
          numbins={numBins}
        ></Histogram>
      </div>
      <div className="histogram-controls-container controls-container">
        <SeriesSelect
          seriesCallback={handleSeriesSelect}
          series={props.seriesOptions}
        />

        <div className="range-container">
          <RangeSlider
            title={'Bin Range'}
            defaultValue={[minData, maxData]}
            rangeCallback={handleRangeChange}
          ></RangeSlider>

          <SingleSlider
            title={'Bins: ' + numBins}
            min={0}
            max={50}
            defaultValue={10}
            sliderCallback={handleNumBinChange}
          ></SingleSlider>
        </div>
      </div>
    </React.Fragment>
  );
};

export { HistogramControl };
