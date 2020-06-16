import React, { useState, useEffect, useRef } from 'react';

import SeriesSelect from '../seriesselect'; // can't destructure for some reason
import { getSeries } from '../sqlload';
import { Heatmap } from '../charts/heatmap';
import { ControlsContainer } from '../controlscontainer';
import { ColorScaleSelect } from '../colorscaleselect';
import { CheckboxInput } from '../checkboxinput';
import { RangeSlider } from '../rangeslider';
import { getBBSize } from '../plotdimensions';
import { ViewWrapper } from './viewwrapper';

const HeatmapControl = props => {
  const [isLoading, setIsLoading] = useState(false);
  const [series, setSeries] = useState([]);
  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [minData, setMinData] = useState(0);
  const [maxData, setMaxData] = useState(0);
  const [reverseColor, setReverseColor] = useState(false);
  const [colorfunc, setColorfunc] = useState('interpolateViridis');
  const [plotdims, setPlotdims] = useState({ width: 50, height: 50 });
  const plotContainer = useRef(null);

  // handle resizing / div size

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

  const handleSeriesSelect = (e, v) => {
    setIsLoading(true);
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
      setIsLoading(false);
    });
  };

  const handleRangeChange = v => {
    setMinRange(v[0]);
    setMaxRange(v[1]);
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
      <ViewWrapper plotContainer={plotContainer} isLoading={isLoading}>
        <Heatmap
          plotdims={plotdims}
          files={props.files}
          series={series}
          units={props.units}
          colorfunc={colorfunc}
          minrange={minRange}
          maxrange={maxRange}
          reversecolor={reverseColor}
        ></Heatmap>
      </ViewWrapper>
      <ControlsContainer tag="heatmap-controls-container">
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
      </ControlsContainer>
    </>
  );
};

export { HeatmapControl };
