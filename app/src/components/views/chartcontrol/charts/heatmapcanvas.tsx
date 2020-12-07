import React, { useState, useEffect, useRef } from 'react';

import { scaleLinear, select, axisLeft, axisBottom, axisRight } from 'd3';

import colorscale from '../colorscaleindex';

import { formatDate, formatDomain } from 'src/format';
import { D3Container } from './d3container';
import { heatmapdims } from './chartdimensions';
import { NoSelectionContainer } from './noselectioncontainer';
import { getSeriesKeys } from 'src/sql';

const HeatmapCanvas = props => {
  const container = useRef(null);
  const {
    files,
    series,
    colorfunc,
    units,
    minrange,
    maxrange,
    reversecolor
  } = props;

  const { width, height } = props.plotdims;

  const clrAxisFormat = formatDomain([minrange, maxrange]);

  const seriesKeys = getSeriesKeys(units, files);

  let title = series[0] ? series[0][seriesKeys.name] : '';

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';
  const unitkey = units == 'ip' ? 'units_ip' : 'units_si';
  const colorFunc = colorscale[colorfunc];

  useEffect(() => {
    createChart();
  }, [series, units, width, height]);

  useEffect(() => {
    createChart();
  }, [colorfunc, reversecolor, minrange, maxrange]);

  const createColorScale = () => {
    const colorScale = scaleLinear().range([0, 1]);
    if (!reversecolor) {
      colorScale.domain([minrange, maxrange]);
    } else {
      colorScale.domain([maxrange, minrange]);
    }
    return colorScale;
  };

  const createChart = () => {
    /* DIMENSIONS */

    const { labelmargins, margins } = heatmapdims;

    const plotwidth = width - margins.l - margins.r;
    const plotheight = height - margins.t - margins.b;

    const rectwidth = plotwidth / 365;
    const rectheight = plotheight / 23;

    const xScale = scaleLinear()
      .domain([0, 365])
      .range([0, plotwidth]);

    const yScale = scaleLinear()
      .domain([0, 24])
      .range([0, plotheight]);

    const colorScale = createColorScale();

    if (container.current) {
      const plotwrapper = select(container.current)
        .selectAll('.plot-wrapper')
        .data([0])
        .join('div')
        .attr('class', 'plot-wrapper')
        .style('height', height + 'px')
        .style('width', width + 'px');

      const plotcontainer = plotwrapper
        .selectAll('.canvas-svg-container')
        .data([0])
        .join('div')
        .attr('class', 'canvas-svg-container')
        .style('position', 'relative');

      const canvas = plotcontainer
        .selectAll('canvas')
        .data([0])
        .join('canvas')
        .attr('width', plotwidth)
        .attr('height', plotheight)
        .style('position', 'absolute')
        .style('left', margins.l + 'px')
        .style('top', margins.t + 'px');

      const context = canvas.node().getContext('2d');

      const svg = plotcontainer
        .selectAll('svg')
        .data([0])
        .join('svg')
        .attr('width', width)
        .attr('height', height)
        .style('position', 'relative');

      /* RECTS - SVG */
      let hoverg = svg
        .selectAll('.hover-rect')
        .data([0])
        .join('rect')
        .attr('class', 'hover-rect')
        .attr('width', plotwidth)
        .attr('height', plotheight)
        .attr('transform', `translate(${margins.l}, ${margins.t})`)
        .style('opacity', 0)
        .on('mouseout', handleMouseout)
        .on('mouseover', handleMouseover)
        .on('mousemove', handleMousemove);

      context.clearRect(0, 0, plotwidth, plotheight);

      series.forEach(d => {
        let x = xScale(d.simulationday - 1);
        let y = yScale(d.hour) - rectheight;
        let w = rectwidth;
        let h = rectheight;

        context.fillStyle = colorFunc(colorScale(d[valkey]));
        context.beginPath();
        context.rect(x, y, w, h);
        context.fill();
      });

      /* AXES */

      //
      const monthobj = {};
      series.forEach(d => {
        let monthformat = {
          1: 'Jan',
          2: 'Feb',
          3: 'Mar',
          4: 'Apr',
          5: 'May',
          6: 'Jun',
          7: 'Jul',
          8: 'Aug',
          9: 'Sep',
          10: 'Oct',
          11: 'Nov',
          12: 'Dec'
        };
        monthobj[d['simulationday']] = monthformat[d['month']];
      });
      const formatMonth = d => monthobj[d];

      const xAxis = axisBottom(xScale)
        .ticks(11)
        .tickFormat(formatMonth);

      const yAxis = axisLeft(yScale).ticks(24);
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
        .text('Time of Year');

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
        .text(() => title);

      /* TOOLTIP */

      let tooltipdiv = select(container.current)
        .selectAll('.tooltip')
        .data([0])
        .join('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      function distanceBetween(p1, p2) {
        let [x1, y1] = p1;
        let [x2, y2] = p2;
        let d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        return d;
      }

      function getClosestPoint(point, array) {
        let distances = [];
        array.forEach((d, i) => {
          let x = xScale(d.simulationday - 1);
          let y = yScale(d.hour) - rectheight;
          let dist = distanceBetween(point, [x, y]);
          distances.push(dist);
        });
        let mindistance = Math.min(...distances);
        let idx = distances.indexOf(mindistance);
        return array[idx];
      }

      function handleMousemove(d) {
        tooltipdiv.style('opacity', 0.85);
        let target = event.target;
        let bbox = target.getBoundingClientRect();

        let mouseRangeX = (event.pageX - bbox.left) / bbox.width;
        let mouseRangeY = (event.pageY - bbox.top) / bbox.height;

        let closest = getClosestPoint(
          [mouseRangeX * bbox.width, mouseRangeY * bbox.height],
          series
        );

        tooltipdiv
          .style('left', event.pageX - 150 + 'px')
          .style('top', event.pageY - 75 + 'px')
          .style('transition', 'left 100ms, top 100ms')
          .html(() => {
            return `
            <div>Time: ${formatDate(closest.time)}</div>
            <div>Value: ${clrAxisFormat(closest[valkey])} ${
              closest[unitkey]
            }</div>
          `;
          });
      }
      function handleMouseover() {
        tooltipdiv.style('opacity', 0.85);
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
      const colorlegendscale = scaleLinear()
        .range([colorlegendheight, 0])
        .domain([minrange, maxrange]);

      const colorLegendAxis = axisRight()
        .scale(colorlegendscale)
        .ticks(5)
        .tickFormat(clrAxisFormat);

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
          `translate(${margins.l +
            plotwidth +
            labelmargins.legend},${margins.t +
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
    }
  };

  if (series.length == 0) {
    return <NoSelectionContainer plotdims={props.plotdims} />;
  } else {
    return <D3Container refcontainer={container}></D3Container>;
  }
};

export { HeatmapCanvas };
