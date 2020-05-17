import React, { useState, useEffect, useRef } from 'react';

import * as d3 from 'd3';

const Heatmap = props => {
  const container = useRef(null);

  const { series, colorscale, units, minrange, maxrange, reversecolor } = props;

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';

  useEffect(() => {
    createChart();
  }, [props.series, units]);

  useEffect(() => {
    updateColor();
  }, [colorscale, reversecolor, minrange, maxrange]);

  const createColorScale = () => {
    // let mindata = 0;
    // let maxdata = 0;
    // series.forEach(d => {
    //   mindata = Math.min(mindata, d[valkey]);
    //   maxdata = Math.max(maxdata, d[valkey]);
    // });

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

    // let mindata = 0;
    // let maxdata = 0;

    // series.forEach(d => {
    //   mindata = Math.min(mindata, d[valkey]);
    //   maxdata = Math.max(maxdata, d[valkey]);
    // });

    const colorScale = createColorScale();

    const svg = d3
      .select(container.current)
      .selectAll('svg')
      .data([0])
      .join('svg');

    svg.attr('width', width).attr('height', height);

    let plotg = svg
      .selectAll('.plotg')
      .data([0])
      .join('g');
    plotg
      .attr('class', 'plotg')
      .attr('transform', `translate(${margins.l}, ${margins.t})`);

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
      });
    rects.exit().remove();

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
  };

  return <div className="heatmap-container" ref={container}></div>;
};

export { Heatmap };
