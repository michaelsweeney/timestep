import React, { useState, useEffect, useRef } from 'react';

import * as d3 from 'd3';
import { formatInt } from '../numformat';

const Heatmap = props => {
  const container = useRef(null);

  const { series, colorscale, units, minrange, maxrange, reversecolor } = props;

  const { width, height } = props.plotdims;

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';
  const unitkey = units == 'ip' ? 'units_ip' : 'units_si';

  useEffect(() => {
    createChart();
  }, [series, units, width, height]);

  useEffect(() => {
    updateColor();
  }, [colorscale, reversecolor, minrange, maxrange]);

  const createColorScale = () => {
    const colorScale = d3.scaleLinear().range([0, 1]);
    if (!reversecolor) {
      colorScale.domain([minrange, maxrange]);
    } else {
      colorScale.domain([maxrange, minrange]);
    }
    return colorScale;
  };

  const updateColor = () => {
    const colorScale = createColorScale();

    let rects = d3
      .select(container.current)
      .select('.plotg')
      .selectAll('.hour_rect');

    rects.attr('class', 'hour_rect').style('fill', d => {
      return d3[colorscale](colorScale(d[valkey]));
    });
  };

  const createChart = () => {
    /* DIMENSIONS */

    const margins = {
      l: 100,
      t: 100,
      b: 50,
      r: 100
    };

    const plotwidth = width - margins.l - margins.r;
    const plotheight = height - margins.t - margins.b;

    const rectwidth = plotwidth / 365;
    const rectheight = plotheight / 23;

    const xScale = d3
      .scaleLinear()
      .domain([0, 365])
      .range([0, plotwidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 24])
      .range([0, plotheight]);

    const colorScale = createColorScale();

    const svg = d3
      .select(container.current)
      .selectAll('svg')
      .data([0])
      .join('svg');

    svg.attr('width', width).attr('height', height);

    /* RECTS */
    let plotg = svg
      .selectAll('.plotg')
      .data([0])
      .join('g');

    plotg
      .attr('class', 'plotg')
      .attr('transform', `translate(${margins.l}, ${margins.t})`)
      .on('mouseout', handleMouseout);

    let rects = plotg
      .selectAll('.hour_rect')
      .data(series)
      .join('rect');

    rects
      .attr('class', 'hour_rect')
      .attr('x', d => xScale(d.simulationday - 1))
      .attr('y', d => yScale(d.hour) - rectheight)
      .attr('width', rectwidth)
      .attr('height', rectheight)
      .style('fill', d => {
        return d3[colorscale](colorScale(d[valkey]));
      })
      .on('mouseover', d => {
        handleMouseover(d);
      });

    rects.exit().remove();

    /* AXES */
    const xAxis = d3.axisBottom(xScale).ticks(12);
    const yAxis = d3.axisLeft(yScale).ticks(24);
    const xaxisg = svg
      .selectAll('.x-axis-g')
      .data([0])
      .join('g')
      .attr('class', 'x-axis-g')
      .attr('transform', `translate(${margins.l}, ${margins.t + plotheight})`)
      .call(xAxis);

    const yaxisg = svg
      .selectAll('.y-axis-g')
      .data([0])
      .join('g')
      .attr('class', 'y-axis-g')
      .attr('transform', `translate(${margins.l}, ${margins.t})`)
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
        .style('top', event.pageY - 100 + 'px')
        .style('transition', 'left 100ms, top 100ms')
        .html(() => {
          return `
            <div>Date: ${d.time}</div>
            <div>Value: ${formatInt(d[valkey])} (${d[unitkey]})</div>

          `;
        });
    }

    function handleMouseout() {
      tooltipdiv.style('opacity', 0);
    }
  };

  return (
    <div className="heatmap-container chart-container" ref={container}></div>
  );
};

export { Heatmap };
