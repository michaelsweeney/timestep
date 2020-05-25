import React, { useState, useEffect, useRef } from 'react';

import * as d3 from 'd3';

const MultiLine = props => {
  const container = useRef(null);
  let { seriesArray, seriesConfig, units } = props;

  let isY1 = true;
  let isY2 = false;

  const yDomain = {
    y1: {
      min: 0,
      max: 1
    },
    y2: {
      min: 0,
      max: 1
    }
  };

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';

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

  useEffect(() => {
    handleDomains();
    createChart();
  }, [seriesArray, seriesConfig]);

  const handleDomains = () => {
    isY2 =
      seriesConfig.filter(f => {
        return f.yaxis == 'Y2';
      }).length > 0
        ? true
        : false;
    isY1 =
      seriesConfig.filter(f => {
        return f.yaxis == 'Y2';
      }).length > 0
        ? true
        : false;

    let y1vals = [];
    let y2vals = [];
    seriesConfig.forEach((c, i) => {
      if (c.yaxis == 'Y1' && seriesArray[i] != undefined) {
        seriesArray[i].forEach(d => y1vals.push(d[valkey]));
      }
      if (c.yaxis == 'Y2' && seriesArray[i] != undefined) {
        seriesArray[i].forEach(d => y2vals.push(d[valkey]));
      }
    });

    yDomain.y1 = {
      min: d3.extent(y1vals)[0],
      max: d3.extent(y1vals)[1]
    };

    yDomain.y2 = {
      min: d3.extent(y2vals)[0],
      max: d3.extent(y2vals)[1]
    };
  };

  const createChart = () => {
    const svg = d3
      .select(container.current)
      .selectAll('svg')
      .data([0])
      .join('svg');

    svg.attr('width', width).attr('height', height);

    let times = [];
    seriesArray.forEach(s => s.forEach(d => times.push(d.time)));

    const xScale = d3
      .scaleTime()
      .range([0, plotwidth])
      .domain(d3.extent(times));

    const yScale1 = d3
      .scaleLinear()
      .range([plotheight, 0])
      .domain([yDomain.y1.min, yDomain.y1.max]);

    const yScale2 = d3
      .scaleLinear()
      .range([plotheight, 0])
      .domain([yDomain.y2.min, yDomain.y2.max]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis1 = d3.axisLeft(yScale1);
    const yAxis2 = d3.axisRight(yScale2);

    const plotg = svg
      .selectAll('.plotg')
      .data([0])
      .join('g')
      .attr('class', 'plotg')
      .attr('transform', `translate(${margins.l},${margins.t})`);

    const xaxisg = svg
      .selectAll('.xaxisg')
      .data([0])
      .join('g')
      .attr('class', 'xaxisg')
      .attr('transform', `translate(${margins.l},${margins.t + plotheight})`)
      .call(xAxis);

    if (isY1 || !isY2) {
      const yaxis1g = svg
        .selectAll('.yaxis1g')
        .data([0])
        .join('g')
        .attr('class', 'yaxis1g')
        .attr('transform', `translate(${margins.l},${margins.t})`)
        .call(yAxis1);
    } else {
      svg.selectAll('.yaxis1g').remove();
    }

    if (isY2) {
      const yaxis2g = svg
        .selectAll('.yaxis2g')
        .data([0])
        .join('g')
        .attr('class', 'yaxis2g')
        .attr('transform', `translate(${margins.l + plotwidth},${margins.t})`)
        .call(yAxis2);
    } else {
      svg.selectAll('.yaxis2g').remove();
    }

    const lineY1 = d3
      .line()
      .x(d => xScale(d.time))
      .y(d => yScale1(d[valkey]));

    const lineY2 = d3
      .line()
      .x(d => xScale(d.time))
      .y(d => yScale2(d[valkey]));

    if (seriesConfig.length == seriesArray.length && seriesConfig.length > 0) {
      plotg
        .selectAll('.series-line')
        .data(seriesArray)
        .join('path')
        .attr('class', 'series-line')
        .attr('d', (d, i) => {
          if (seriesConfig[i].yaxis == 'Y1' && seriesConfig[i].visible) {
            return lineY1(d);
          }
          if (seriesConfig[i].yaxis == 'Y2' && seriesConfig[i].visible) {
            return lineY2(d);
          }
        })
        .style('stroke', (d, i) => seriesConfig[i].color)
        .style('fill', 'none');
    }
  };

  return <div className="multiline-container" ref={container}></div>;
};

export { MultiLine };
