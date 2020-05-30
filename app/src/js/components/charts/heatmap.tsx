import React, { useState, useEffect, useRef } from 'react';

import * as d3 from 'd3';
import { formatInt } from '../numformat';

const Heatmap = props => {
  const container = useRef(null);

  const { series, colorfunc, units, minrange, maxrange, reversecolor } = props;

  const { width, height } = props.plotdims;

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';
  const unitkey = units == 'ip' ? 'units_ip' : 'units_si';
  const colorFunc = d3[colorfunc];

  useEffect(() => {
    createChart();
  }, [series, units, width, height]);

  useEffect(() => {
    createChart();
  }, [colorfunc, reversecolor, minrange, maxrange]);

  const createColorScale = () => {
    const colorScale = d3.scaleLinear().range([0, 1]);
    if (!reversecolor) {
      colorScale.domain([minrange, maxrange]);
    } else {
      colorScale.domain([maxrange, minrange]);
    }
    return colorScale;
  };

  const createChart = () => {
    /* DIMENSIONS */
    const labelmargins = {
      y: 40,
      x: 40,
      title: 20,
      legend: 50,
      legendlabel: 100
    };
    const margins = {
      l: 100,
      t: 50,
      b: 50,
      r: 125
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
        return colorFunc(colorScale(d[valkey]));
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
    xlabelg
      .selectAll('text')
      .data([0])
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'x-axis-text axis-text')
      .text('Day of Year');

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

    ylabelg
      .selectAll('text')
      .data([0])
      .join('text')
      .attr('class', 'y-axis-text axis-text')
      .attr('text-anchor', 'middle')
      .text('Hour of Day');

    const legendlabelg = svg
      .selectAll('.legendlabelg')
      .data([0])
      .join('g')
      .attr('class', 'legendlabelg')
      .attr(
        'transform',
        `translate(${margins.l +
          plotwidth +
          labelmargins.legendlabel},${margins.t + plotheight / 2})rotate(270)`
      );

    legendlabelg
      .selectAll('text')
      .data([0])
      .join('text')
      .attr('class', 'z-axis-text axis-text')
      .attr('text-anchor', 'middle')
      .text(() => (series[0] != undefined ? series[0][unitkey] : '-'));

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

    titleg
      .selectAll('text')
      .data([0])
      .join('text')
      .attr('class', 'title-text')
      .attr('text-anchor', 'middle')
      .text(() => (series[0] ? series[0].name + ' Heatmap' : '-'));

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

    /* COLOR LEGEND */

    const defs = svg
      .selectAll('.defsg')
      .data([0])
      .join('g')
      .attr('class', 'defsg')
      .selectAll('.color-gradient')
      .data([0])
      .join('defs')
      .attr('class', 'color-gradient');

    const colorlegendheight = plotheight / 1.5;
    const colorlegendscale = d3
      .scaleLinear()
      .range([colorlegendheight, 0])
      .domain([minrange, maxrange]);

    const colorLegendAxis = d3
      .axisRight()
      .scale(colorlegendscale)
      .ticks(5);

    let gradientid = Math.floor(Math.random() * 1e6) + '-gradient';

    // innerhtml avoids bugs at render, for some reason lineargradient id isn't picked up otherwise
    defs.html(
      `<LinearGradient
      class="linear-gradient"
      id="${gradientid}"
      y1="0%"
      x1="100%"
      y2="100%"
      x2="100%"
      spreadMethod="pad">
        <stop
          class="stop0"
          stop-color="${!reversecolor ? colorFunc(1.0) : colorFunc(0.0)}"
          offset="0%"
          stop-opacity="1"
        ></stop>
        <stop
          class="stop33"
          stop-color="${!reversecolor ? colorFunc(0.66) : colorFunc(0.33)}"
          offset="33%"
          stop-opacity="1"
        ></stop>
        <stop
          class="stop66"
          stop-color="${!reversecolor ? colorFunc(0.33) : colorFunc(0.66)}"
          offset="66%"
          stop-opacity="1"
        ></stop>
        <stop
          class="stop100"
          stop-color="${!reversecolor ? colorFunc(0.0) : colorFunc(1.0)}"
          offset="100%"
          stop-opacity="1"
        ></stop>
      </LinearGradient>`
    );

    const legendg = svg
      .selectAll('.legendg')
      .data([0])
      .join('g')
      .attr('class', 'legendg')
      .attr(
        'transform',
        `translate(${margins.l + plotwidth + labelmargins.legend},${margins.t +
          plotheight / 2 -
          colorlegendheight / 2})`
      );

    legendg.call(colorLegendAxis);
    legendg
      .selectAll('.clr-rect')
      .data([0])
      .join('rect')
      .attr('x', -30)
      .attr('class', 'clr-rect')
      .attr('width', 30)
      .attr('height', colorlegendheight)
      .style('fill', `url(#${gradientid})`);
  };

  return (
    <div className="heatmap-container chart-container" ref={container}></div>
  );
};

export { Heatmap };
