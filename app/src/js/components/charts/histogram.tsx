import React, { useState, useEffect, useRef } from 'react';

import * as d3 from 'd3';

const Histogram = props => {
  const container = useRef(null);

  const { series, units, binmin, binmax, numbins } = props;
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
    createChart();
  }, [series, units]);

  useEffect(() => {
    createChart();
  }, [binmin, binmax, numbins]);

  const createChart = () => {
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
      .domain([binmin, binmax]);

    const yScale = d3.scaleLinear().range([plotheight, 0]);

    const histogram = d3
      .histogram()
      .value(d => {
        return d[valkey];
      })
      .domain(xScale.domain())
      .thresholds(xScale.ticks(numbins));

    const bins = histogram(series);

    const ymax = d3.max(bins.map(d => d.length));

    yScale.domain([0, ymax]);

    plotg
      .selectAll('.rect_plot')
      .data(bins)
      .join('rect')
      .attr('class', 'rect_plot')
      .attr('x', 1)
      .style('fill', '#3f8cb5')
      .attr('transform', d => {
        return `translate(${xScale(d.x0)},${yScale(d.length)})`;
      })
      .attr('width', d => {
        return Math.abs(xScale(d.x1) - xScale(d.x0)) * 0.95;
      })
      .attr('height', d => {
        return plotheight - yScale(d.length);
      });

    const xAxis = d3.axisBottom(xScale).ticks(numbins);

    const xAxis_container = svg
      .selectAll('.xaxisg')
      .data([0])
      .join('g')
      .attr('class', 'xaxisg')
      .attr('transform', `translate(${margins.l} ,  ${margins.t + plotheight})`)
      .call(xAxis);

    const yAxis = d3.axisLeft(yScale);

    const yAxis_container = svg
      .selectAll('.yaxisg')
      .data([0])
      .join('g')
      .attr('class', 'yaxisg')
      .attr('transform', `translate(${margins.l},${margins.t})`)
      .call(yAxis);

    xAxis_container.call(xAxis);

    yAxis_container.call(yAxis);
  };

  return <div className="histogram-container" ref={container}></div>;
};

export { Histogram };
