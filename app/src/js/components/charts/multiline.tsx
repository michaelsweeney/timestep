import React, { useState, useEffect, useRef } from 'react';
import { formatInt } from '../numformat';

import * as d3 from 'd3';

const MultiLine = props => {
  const container = useRef(null);
  let { seriesArray, seriesConfig, units } = props;
  const { width, height } = props.plotdims;

  let isY1 = true;
  let isY2 = false;

  const yconfig = {
    y1: {
      min: 0,
      max: 1,
      units: []
    },
    y2: {
      min: 0,
      max: 1,
      units: []
    }
  };

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';
  const unitkey = units == 'ip' ? 'units_ip' : 'units_si';

  const labelmargins = {
    y1: 50,
    y2: 80,
    x: 40,
    title: 20
  };

  const margins = {
    l: 100,
    t: 50,
    b: 50,
    r: 100
  };

  const plotwidth = width - margins.l - margins.r;
  const plotheight = height - margins.t - margins.b;

  useEffect(() => {
    handleYAxes();
    createChart();
  }, [seriesArray, seriesConfig, width, height]);

  const handleYAxes = () => {
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

    let y1units = [];
    let y2units = [];

    seriesConfig.forEach((c, i) => {
      if (
        c.yaxis == 'Y1' &&
        seriesArray[i] != undefined &&
        c.visible === true
      ) {
        seriesArray[i].forEach(d => y1vals.push(d[valkey]));
        let unit = seriesArray[i][0][unitkey];
        if (!y1units.includes(unit)) {
          y1units.push(seriesArray[i][0][unitkey]);
        }
      }
      if (
        c.yaxis == 'Y2' &&
        seriesArray[i] != undefined &&
        c.visible === true
      ) {
        seriesArray[i].forEach(d => y2vals.push(d[valkey]));
        let unit = seriesArray[i][0][unitkey];
        if (!y2units.includes(unit)) {
          y2units.push(seriesArray[i][0][unitkey]);
        }
      }
    });

    yconfig.y1 = {
      min: d3.extent(y1vals)[0],
      max: d3.extent(y1vals)[1],
      units: y1units
    };

    yconfig.y2 = {
      min: d3.extent(y2vals)[0],
      max: d3.extent(y2vals)[1],
      units: y2units
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
      .domain([yconfig.y1.min, yconfig.y1.max]);

    const yScale2 = d3
      .scaleLinear()
      .range([plotheight, 0])
      .domain([yconfig.y2.min, yconfig.y2.max]);

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
      .text('Time');

    const ylabel1g = svg
      .selectAll('.ylabel1g')
      .data([0])
      .join('g')
      .attr('class', 'ylabel1g')
      .attr(
        'transform',
        `translate(${margins.l - labelmargins.y1},${margins.t +
          plotheight / 2})rotate(270)`
      );
    ylabel1g
      .selectAll('text')
      .data([0])
      .join('text')
      .attr('class', 'y-axis-text axis-text')
      .attr('text-anchor', 'middle')
      .text(() => yconfig.y1.units.join(' / '));

    const ylabel2g = svg
      .selectAll('.ylabel2g')
      .data([0])
      .join('g')
      .attr('class', 'ylabel2g')
      .attr(
        'transform',
        `translate(${margins.l + plotwidth + labelmargins.y2},${margins.t +
          plotheight / 2})rotate(270)`
      );
    ylabel2g
      .selectAll('text')
      .data([0])
      .join('text')
      .attr('class', 'y-axis-text axis-text')
      .attr('text-anchor', 'middle')
      .text(() => yconfig.y2.units.join(' / '));

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
      .text(() => 'Multiline Title tbd');

    /* TOOLTIP */

    const mouserect = plotg
      .selectAll('.mouserect')
      .data([0])
      .join('rect')
      .attr('class', 'mouserect')
      .attr('height', plotheight)
      .attr('width', plotwidth)
      .style('opacity', 0)
      .on('mousemove', mouseMove)
      .on('mouseout', mouseOut)
      .on('mouseover', mouseOver);

    const tooltipg = plotg
      .selectAll('.tooltipg')
      .data([0])
      .join('g')
      .attr('class', 'tooltipg');

    const markers = tooltipg
      .selectAll('.marker-circle')
      .data(seriesArray)
      .join('circle')
      .attr('class', 'marker-circle')
      .attr('r', 3)
      .style('stroke', 'blue');

    const tooltip = d3
      .select(container.current)
      .selectAll('.tooltip')
      .data(seriesArray)
      .join('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    function mouseOver(e) {
      markers.style('opacity', 1);
      tooltip.style('opacity', 1);
    }
    function mouseMove(e) {
      let xpos = xScale.invert(d3.mouse(this)[0]);

      let bisectDate = d3.bisector(function(d) {
        return d.time;
      }).left;

      let pointarray = [];

      seriesArray.forEach((d, i) => {
        let idx;
        let point;
        let marker;

        if (seriesConfig[i].yaxis == 'Y1' && seriesConfig[i].visible) {
          idx = bisectDate(d, xpos);
          point = d[idx];
          pointarray.push(d[idx]);

          marker = d3.select(markers.nodes()[i]);
          marker
            .style('opacity', 1)
            .transition()
            .duration(50)
            .attr('cx', () => xScale(point.time))
            .attr('cy', () => yScale1(point[valkey]));
        } else if (seriesConfig[i].yaxis == 'Y2' && seriesConfig[i].visible) {
          idx = bisectDate(d, xpos);
          point = d[idx];
          pointarray.push(d[idx]);

          marker = d3.select(markers.nodes()[i]);
          marker
            .style('opacity', 1)
            .transition()
            .duration(50)
            .attr('cx', () => xScale(point.time))
            .attr('cy', () => yScale2(point[valkey]));
        } else {
          marker = d3.select(markers.nodes()[i]);
          marker.style('opacity', 0);
        }
      });

      // should check that all pointarray 'times' line up.
      // if not, find first matching and then drive the rest of the series.

      let timecheck = new Set(pointarray.map(d => d.time.getTime()));
      if (timecheck.length > 1) {
        alert('dev warning: times not aligned between arrays');
      }

      tooltip
        .style('left', event.pageX - 100 + 'px')
        .style('top', event.pageY - 100 + 'px')
        .style('transition', 'left 100ms, top 100ms')
        .style('opacity', 1).html(`
      <div>
      <div>${pointarray[0].time}</div>
      ${pointarray.map(d => {
        return `
        <div>
          <div>${d.name}</div>
          <div>${formatInt(d[valkey]) + ' ' + d[unitkey]}</div>
        <div>
        `;
      })}</div>
      `);

      // if (seriesConfig[i].yaxis == 'Y1' && seriesConfig[i].visible) {
    }
    function mouseOut(e) {
      markers.style('opacity', 0);
      tooltip.style('opacity', 0);
    }

    // const tipg = svg.selectAll('.tipg').dat([0]).join('g').attr('class', 'tipg')
    // const tip = tipg.selectAll('div')
  };

  return (
    <div className="multiline-container chart-container" ref={container}></div>
  );
};

export { MultiLine };
