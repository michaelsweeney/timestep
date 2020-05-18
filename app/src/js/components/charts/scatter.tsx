import React, { useState, useEffect, useRef } from 'react';

import * as d3 from 'd3';
import { color } from '@material-ui/system';

const Scatter = props => {
  const container = useRef(null);

  const {
    units,
    colorscale,
    reversecolor,
    xseries,
    xminrange,
    xmaxrange,
    yseries,
    yminrange,
    ymaxrange,
    zseries,
    zminrange,
    zmaxrange
  } = props;

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';

  useEffect(() => {
    createChart();
  }, [
    units,
    colorscale,
    reversecolor,
    xseries,
    xminrange,
    xmaxrange,
    yseries,
    yminrange,
    ymaxrange,
    zseries,
    zminrange,
    zmaxrange
  ]);

  const createColorScale = () => {
    const colorScale = d3.scaleLinear().range([0, 1]);
    if (!reversecolor) {
      colorScale.domain([zminrange, zmaxrange]);
    } else {
      colorScale.domain([zmaxrange, zminrange]);
    }
    return colorScale;
  };

  const createChart = () => {
    const width = 1200;
    const height = 500;
    const margins = {
      l: 100,
      t: 100,
      b: 50,
      r: 50
    };

    const plotwidth = width - margins.l - margins.r;
    const plotheight = height - margins.t - margins.b;

    const svg = d3
      .select(container.current)
      .selectAll('svg')
      .data([0])
      .join('svg');

    svg.attr('width', width).attr('height', height);

    const plotg = svg
      .selectAll('.plotg')
      .data([0])
      .join('g');
    plotg
      .attr('class', 'plotg')
      .attr('transform', `translate(${margins.l}, ${margins.t})`);

    const xScale = d3
      .scaleLinear()
      .range([0, plotwidth])
      .domain([xminrange, xmaxrange]);

    const yScale = d3
      .scaleLinear()
      .range([plotheight, 0])
      .domain([yminrange, ymaxrange]);

    const colorScale = createColorScale();
    const colorFunc = d3[colorscale];

    // create data object with x, y, z, time
    const dataArr = [];

    xseries.forEach((d, i) => {
      let time = d.time;
      let xval = d[valkey];
      let yval = '';
      let zval = '';

      if (yseries.length >= i) {
        if (typeof yseries[i] == 'object') {
          if (yseries[i].time.getTime() == time.getTime()) {
            yval = yseries[i][valkey];
          }
        }
      }

      if (zseries.length >= i) {
        if (typeof zseries[i] == 'object') {
          if (zseries[i].time.getTime() == time.getTime()) {
            zval = zseries[i][valkey];
          }
        }
      }

      dataArr.push({
        x: xval,
        y: yval,
        z: zval,
        time: time
      });
    });

    const circles = plotg
      .selectAll('.circle-point')
      .data(dataArr)
      .join('circle')
      .attr('class', 'circle-point');

    circles
      .attr('r', 3)
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('fill', d => (d.z == '' ? '#3f8cb5' : colorFunc(colorScale(d.z))));
    // .attr('stroke', 'blue');
  };

  return <div className="scatter-container" ref={container}></div>;
};

export { Scatter };
