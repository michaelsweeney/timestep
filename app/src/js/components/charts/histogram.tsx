import React, { useState, useEffect, useRef } from 'react';
import { formatInt } from '../numformat';
import * as d3 from 'd3';

const Histogram = props => {
  const container = useRef(null);

  const { series, units, binmin, binmax, numbins } = props;
  const valkey = units == 'ip' ? 'value_ip' : 'value_si';
  const unitkey = units == 'ip' ? 'units_ip' : 'units_si';
  const { width, height } = props.plotdims;

  useEffect(() => {
    createChart();
  }, [series, units, width, height]);

  useEffect(() => {
    createChart();
  }, [binmin, binmax, numbins]);

  const createChart = () => {
    /* DIMENSIONS */
    const labelmargins = {
      y: 40,
      x: 40,
      title: 30
    };
    const margins = {
      l: 100,
      t: 50,
      b: 50,
      r: 100
    };

    const plotwidth = width - margins.l - margins.r;
    const plotheight = height - margins.t - margins.b;

    /* SVG SETUP */
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
      .attr('transform', `translate(${margins.l}, ${margins.t})`)
      .on('mouseout', handleMouseout);

    /* SCALES */
    const xScale = d3
      .scaleLinear()
      .range([0, plotwidth])
      .domain([binmin, binmax]);

    const yScale = d3.scaleLinear().range([plotheight, 0]);

    const histogram = d3
      .histogram()
      .value(d => d[valkey])
      .domain(xScale.domain())
      .thresholds(xScale.ticks(numbins));

    const bins = histogram(series);

    const ymax = d3.max(bins.map(d => d.length));

    yScale.domain([0, ymax]);

    /* DATA RECTS */
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
      .attr('width', d => Math.abs(xScale(d.x1) - xScale(d.x0)) * 0.95)
      .attr('height', d => plotheight - yScale(d.length))
      .on('mouseover', (d, i, nodes) => {
        d3.select(nodes[i]).style('opacity', 0.8);
        handleMouseover(d);
      })
      .on('mouseout', (d, i, nodes) => {
        d3.select(nodes[i]).style('opacity', 1.0);
      });

    /* AXES */
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

    /* LABELS AND TITLES */
    const xlabelg = svg
      .selectAll('.xlabelg')
      .data([0])
      .join('g')
      .attr('class', 'xlabelg')
      .attr(
        'transform',
        `translate(${margins.l + plotwidth / 2},${margins.t +
          plotheight +
          labelmargins.x})`
      );

    const ylabelg = svg
      .selectAll('.ylabelg')
      .data([0])
      .join('g')
      .attr('class', 'ylabelg')
      .attr(
        'transform',
        `translate(${margins.l - labelmargins.y},${margins.t +
          plotheight / 2})rotate(270)`
      );

    const titleg = svg
      .selectAll('.titleg')
      .data([0])
      .join('g')
      .attr('class', 'titleg')
      .attr(
        'transform',
        `translate(${margins.l + plotwidth / 2},${margins.t -
          labelmargins.title})`
      );

    xlabelg
      .selectAll('text')
      .data([0])
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'x-axis-text axis-text')
      .text(() => (series[0] ? series[0][unitkey] : '-'));

    ylabelg
      .selectAll('text')
      .data([0])
      .join('text')
      .attr('class', 'y-axis-text axis-text')
      .attr('text-anchor', 'middle')
      .text(() => (series[0] ? 'Frequency' : '-'));

    titleg
      .selectAll('text')
      .data([0])
      .join('text')
      .attr('class', 'title-text')
      .attr('text-anchor', 'middle')
      .text(() => (series[0] ? series[0].name + ' Histogram' : '-'));

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
        .style('left', event.pageX - 250 + 'px')
        .style('top', event.pageY - 100 + 'px')
        .style('transition', 'left 100ms, top 100ms')
        .html(() => {
          return `
            <div>Range: ${d.x0} - ${d.x1} ${d[0][unitkey]}</div>
            <div>Count: ${d.length}</div>
          `;
        })
        .style('z-index', 999);
    }

    function handleMouseout(d) {
      tooltipdiv.style('opacity', 0).style('z-index', -1);
    }
  };

  return (
    <div className="histogram-container chart-container" ref={container}></div>
  );
};

export { Histogram };
