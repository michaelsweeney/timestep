import React, { useState, useEffect, useRef } from 'react';

import * as d3 from 'd3';
import { color } from '@material-ui/system';
import { formatInt } from '../numformat';
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

  const { width, height } = props.plotdims;

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';
  const unitkey = units == 'ip' ? 'units_ip' : 'units_si';

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
    zmaxrange,
    width,
    height
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
    /* DIMENSIONS */

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

    /* SCALES */

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

    /* HANDLE DATA */

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

    // get units for each dimension;
    const xunits = xseries[0] != undefined ? xseries[0][unitkey] : '';
    const yunits = yseries[0] != undefined ? yseries[0][unitkey] : '';
    const zunits = zseries[0] != undefined ? zseries[0][unitkey] : '';
    const circles = plotg
      .selectAll('.circle-point')
      .data(dataArr)
      .join('circle')
      .attr('class', 'circle-point');

    circles
      .attr('r', 3)
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('fill', d => (d.z === '' ? '#3f8cb5' : colorFunc(colorScale(d.z))))
      .on('mouseover', (d, i, node) => {
        // d3.select(node[i]).attr('r', 10);
        handleMouseover(d);
      })
      .on('mouseout', (d, i, node) => {
        // d3.select(node[i]).attr('r', 3);
        handleMouseout(d);
      });
    /* AXES */
    const xAxis = d3.axisBottom(xScale);
    const xaxisg = svg
      .selectAll('.xaxisg')
      .data([0])
      .join('g')
      .attr('class', 'xaxisg')
      .attr('transform', `translate(${margins.l},${plotheight + margins.t})`)
      .call(xAxis);

    const yAxis = d3.axisLeft(yScale);
    const yaxisg = svg
      .selectAll('.yaxisg')
      .data([0])
      .join('g')
      .attr('class', 'yaxisg')
      .attr('transform', `translate(${margins.l},${margins.t})`)
      .call(yAxis);

    /* TOOLTIP */

    let tooltipdiv = d3
      .select(container.current)
      .selectAll('.tooltip')
      .data([0])
      .join('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    function handleMouseover(d) {
      tooltipdiv
        .style('opacity', 1)
        .style('left', event.pageX - 200 + 'px')
        .style('top', event.pageY - 150 + 'px')
        .style('transition', 'left 100ms, top 100ms')
        .html(() => {
          return `
          <div>${d.time}</div>
          <div>x: ${formatInt(d.x)} ${xunits}</div>
          <div>y: ${formatInt(d.y)} ${yunits}</div>
          <div>y: ${formatInt(d.z)} ${zunits}</div>
        `;
        })
        .style('z-index', 999);
    }

    function handleMouseout(d) {
      tooltipdiv.style('opacity', 0).style('z-index', -1);
    }
  };

  return (
    <div className="scatter-container chart-container" ref={container}></div>
  );
};

export { Scatter };
