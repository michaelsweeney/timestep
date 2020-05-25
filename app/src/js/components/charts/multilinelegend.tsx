import React, { useState, useEffect, useRef } from 'react';

import * as d3 from 'd3';
import { isContinueStatement } from '@babel/types';

const MultiLineLegend = props => {
  const { seriesArray, units, colorScheme } = props;

  const [seriesState, setSeriesState] = useState([]);

  useEffect(() => {
    let stateCopy = [];
    seriesArray.forEach((d, i) => {
      stateCopy.push({
        name: d[0].name,
        key: d[0].key,
        color: d3[colorScheme][i],
        yaxis: 'Y1',
        visible: true,
        highlighted: false
      });
    });
    setSeriesState(stateCopy);
    props.legendCallback(stateCopy);
  }, [seriesArray, units, colorScheme]);

  const handleYAxisChange = e => {
    let arraynum = e.target.getAttribute('arraynum');
    let stateCopy = [...seriesState];
    stateCopy[arraynum].yaxis = stateCopy[arraynum].yaxis == 'Y1' ? 'Y2' : 'Y1';
    setSeriesState(stateCopy);
    props.legendCallback(stateCopy);
  };

  const handleVisibleChange = e => {
    let arraynum = e.target.getAttribute('arraynum');
    let stateCopy = [...seriesState];
    stateCopy[arraynum].visible = !stateCopy[arraynum].visible;
    setSeriesState(stateCopy);
    props.legendCallback(stateCopy);
  };

  const createChart = () => {};

  const rectStyle = d => {
    return {
      backgroundColor: d.color,
      opacity: d.visible ? 1 : 0.5
    };
  };

  const textStyle = d => {
    return {
      opacity: d.visible ? 1 : 0.5
    };
  };

  const axisStyle = d => {
    return {
      opacity: d.visible ? 1 : 0.5
    };
  };

  return (
    <div className="multiline-handle-container">
      {seriesState.map((d, i) => {
        return (
          <div key={Math.random()} className="legend-row">
            <div
              className="legend-rect"
              style={rectStyle(d)}
              onClick={handleVisibleChange}
              arraynum={i}
            ></div>
            <div
              arraynum={i}
              onClick={handleYAxisChange}
              style={axisStyle(d)}
              className="legend-axis-switch"
            >
              {d.yaxis}
            </div>
            <div
              style={textStyle(d)}
              // onClick={handleVisibleChange}
              className="legend-name"
              arraynum={i}
            >
              {d.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { MultiLineLegend };
