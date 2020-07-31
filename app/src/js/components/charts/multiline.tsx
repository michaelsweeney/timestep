import React, { useState, useEffect, useRef } from 'react';
import { formatDomain, formatDate, formatInt } from '../numformat';
import { D3Container } from './d3container';
import { multilinedims } from './chartdimensions';

import * as d3 from 'd3';

const MultiLine = props => {
  const container = useRef(null);
  let { seriesArray, seriesConfig, units } = props;
  const { width, height } = props.plotdims;
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomDomain, setZoomDomain] = useState({
    x: []
  });

  const ytoppad = 0.05;

  const yconfig = {
    y1: {
      min: 0,
      max: 1,
      units: [],
      active: true
    },
    y2: {
      min: 0,
      max: 1,
      units: [],
      active: false
    }
  };

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';
  const unitkey = units == 'ip' ? 'units_ip' : 'units_si';

  const { labelmargins, margins, contextmargins } = multilinedims;

  const contextheight = 40;
  const contextwidth = width - contextmargins.l - contextmargins.r;
  const plotwidth = width - margins.l - margins.r;
  const plotheight =
    height -
    margins.t -
    margins.b -
    contextheight -
    contextmargins.t -
    contextmargins.b;

  useEffect(() => {
    handleYAxes();
    createChart();
  }, [seriesArray, seriesConfig, width, height]);

  const handleYAxes = () => {
    yconfig.y2.active =
      seriesConfig.filter(f => {
        return f.yaxis == 'Y2';
      }).length > 0
        ? true
        : false;
    yconfig.y1.active =
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
      units: y1units,
      active: yconfig.y1.active
    };

    yconfig.y2 = {
      min: d3.extent(y2vals)[0],
      max: d3.extent(y2vals)[1],
      units: y2units,
      active: yconfig.y2.active
    };
  };

  const createChart = () => {
    let clipid = Math.floor(Math.random() * 1e6) + '-clip';

    const svg = d3
      .select(container.current)
      .selectAll('svg')
      .data([0])
      .join('svg');

    svg.attr('width', width).attr('height', height);

    let times = [];
    seriesArray.forEach(s => s.forEach(d => times.push(d.time)));
    let xdomain = d3.extent(times);

    const xScale = d3.scaleTime().range([0, plotwidth]);
    const contextXScale = d3
      .scaleTime()
      .range([0, plotwidth])
      .domain(xdomain);

    if (!isZoomed) {
      xScale.domain(xdomain);
    } else {
      xScale.domain(zoomDomain.x);
    }

    const yScale1 = d3
      .scaleLinear()
      .range([plotheight, 0])
      .domain([yconfig.y1.min, yconfig.y1.max * (1 + ytoppad)]);

    const yScale2 = d3
      .scaleLinear()
      .range([plotheight, 0])
      .domain([yconfig.y2.min, yconfig.y2.max * (1 + ytoppad)]);

    const yAxis1Format = formatDomain([yconfig.y1.min, yconfig.y1.max]);
    const yAxis2Format = formatDomain([yconfig.y2.min, yconfig.y2.max]);

    const xAxis = d3.axisBottom(xScale);
    const contextXAxis = d3.axisBottom(contextXScale);
    const yAxis1 = d3.axisLeft(yScale1).tickFormat(yAxis1Format);
    const yAxis2 = d3.axisRight(yScale2).tickFormat(yAxis2Format);

    const defs = svg
      .selectAll('defs')
      .data([0])
      .join('defs');

    const plotg = svg
      .selectAll('.plotg')
      .data([0])
      .join('g')
      .attr('class', 'plotg')
      .attr('transform', `translate(${margins.l},${margins.t})`)
      .attr('clip-path', `url(#${clipid})`);

    const contextg = svg
      .selectAll('.contextg')
      .data([0])
      .join('g')
      .attr('class', 'contextg')
      .attr(
        'transform',
        `translate(${contextmargins.l},${margins.t +
          plotheight +
          margins.b +
          contextmargins.t})`
      );

    const contextxaxisg = svg
      .selectAll('.contextxaxisg')
      .data([0])
      .join('g')
      .attr('class', 'contextxaxisg')
      .attr(
        'transform',
        `translate(${contextmargins.l},${margins.t +
          plotheight +
          margins.b +
          contextheight +
          contextmargins.t})`
      )
      .call(contextXAxis);

    const xaxisg = svg
      .selectAll('.xaxisg')
      .data([0])
      .join('g')
      .attr('class', 'xaxisg')
      .attr('transform', `translate(${margins.l},${margins.t + plotheight})`)
      .call(xAxis);

    const yaxis1g = svg
      .selectAll('.yaxis1g')
      .data([0])
      .join('g')
      .attr('class', 'yaxis1g')
      .attr('transform', `translate(${margins.l},${margins.t})`);

    const yaxis2g = svg
      .selectAll('.yaxis2g')
      .data([0])
      .join('g')
      .attr('class', 'yaxis2g')
      .attr('transform', `translate(${margins.l + plotwidth},${margins.t})`);

    if (yconfig.y1.active || !yconfig.y2.active) {
      yaxis1g.call(yAxis1);
    } else {
      svg.selectAll('.yaxis1g').remove();
    }
    if (yconfig.y2.active) {
      yaxis2g.call(yAxis2);
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
        .style('stroke-width', '2px')
        .style('fill', 'none');
    }

    if (seriesArray.length == 0) {
      plotg.selectAll('.series-line').remove();
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
      .text('');

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
      .text('');

    /* TOOLTIP */

    const hoverg = svg
      .selectAll('.hoverg')
      .data([0])
      .join('g')
      .attr('class', 'hoverg')
      .attr('transform', `translate(${margins.l},${margins.t})`);

    const xline = hoverg
      .selectAll('.x-line')
      .data([0])
      .join('line')
      .attr('class', 'x-line')
      .attr('stroke', 'black')
      .attr('stroke-dasharray', '4, 4')
      .attr('y1', 0)
      .attr('y2', plotheight)
      .style('opacity', 0);

    const markers = hoverg
      .selectAll('.marker-circle')
      .data(seriesArray)
      .join('circle')
      .attr('class', 'marker-circle')
      .attr('r', 4);

    const tooltip = d3
      .select(container.current)
      .selectAll('.tooltip')
      .data(seriesArray)
      .join('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    function hideHover() {
      markers.style('opacity', 0);
      xline.style('opacity', 0);
      tooltip.style('opacity', 0);
    }
    function showHover() {
      markers.style('opacity', 0);
      xline.style('opacity', 0);
      tooltip.style('opacity', 0);
    }

    function mouseOver(e) {
      markers.style('opacity', 1);
      xline.style('opacity', 1);
      tooltip.style('opacity', 1);
    }

    function mouseMove(e) {
      let xpos = xScale.invert(d3.mouse(this)[0]);

      let bisectDate = d3.bisector(function(d) {
        return d.time;
      }).left;

      let pointarray = [];
      seriesArray.forEach((d, i) => {
        let idx = bisectDate(d, xpos);

        let pointleft = d[idx];
        let pointright = d[idx + 1];

        let deltaleft = Math.abs(xpos - pointleft.time);
        let deltaright = Math.abs(pointright.time - xpos);

        let point = deltaleft < deltaright ? pointleft : pointright;

        let marker = d3.select(markers.nodes()[i]);
        pointarray.push(d[idx]);
        marker
          .attr('cx', () => xScale(point.time))
          .attr('cy', () => {
            if (seriesConfig[i].yaxis == 'Y1' && seriesConfig[i].visible) {
              return yScale1(point[valkey]);
            } else if (
              seriesConfig[i].yaxis == 'Y2' &&
              seriesConfig[i].visible
            ) {
              return yScale2(point[valkey]);
            }
          })
          .style('fill', () => seriesConfig[i].color)
          .style('stroke', () => seriesConfig[i].color)
          .style('opacity', 1);
      });

      // should check that all pointarray 'times' line up.
      // if not, find first matching and then drive the rest of the series.
      let timecheck = new Set(pointarray.map(d => d.time.getTime()));
      if (timecheck.length > 1) {
        alert('warning: times not aligned between arrays');
      }

      xline
        .style('opacity', 1)
        .attr('x1', xScale(pointarray[0].time))
        .attr('x2', xScale(pointarray[0].time));

      tooltip
        .style('left', event.pageX - 175 + 'px')
        .style('top', event.pageY - 100 + 'px')
        .style('transition', 'left 100ms, top 100ms')
        .style('opacity', 1).html(`
      <div>
      <div class='tooltip-time'>${formatDate(pointarray[0].time)}</div>
      ${pointarray
        .map((d, i) => {
          return `
        <div>
          <div class='tooltip-rect' style=
          "
          background-color: ${seriesConfig[i].color};
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-left: 10px;
          margin-right: 10px;
          transition: opacity 200ms;
          box-sizing: border-box;
          border-radius: 2px;
          "
          ></div>
          <div style='display: inline-block'>${formatInt(d[valkey]) +
            ' ' +
            d[unitkey]}</div>
        </div>
        `;
        })
        .join('')}</div>
      `);
    }

    function mouseOut(e) {
      xline.style('opacity', 0);
      markers.style('opacity', 0);
      tooltip.style('opacity', 0);
    }

    /* HANDLE ZOOM & BRUSH */

    const clippath = defs
      .selectAll('.clip-path')
      .data([0])
      .join('clipPath')
      .attr('id', clipid)
      .attr('class', 'clip-path');

    clippath
      .selectAll('rect')
      .data([0])
      .join('rect')
      .attr('width', plotwidth)
      .attr('height', plotheight)
      .attr('x', 0)
      .attr('y', 0);

    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [contextwidth, contextheight]
      ])
      .on('brush end', brushed);

    const zoom = d3
      .zoom()
      .scaleExtent([1, Infinity])
      .translateExtent([
        [0, 0],
        [plotwidth, plotheight]
      ])
      .extent([
        [0, 0],
        [plotwidth, plotheight]
      ])
      .on('zoom', zoomed);

    let idleTimeout;
    let idleDelay = 350;

    function idled() {
      idleTimeout = null;
    }

    function brushed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
      var s = d3.event.selection || contextXScale.range();
      xScale.domain(s.map(contextXScale.invert, contextXScale));
      plotg.selectAll('.series-line').attr('d', (d, i) => {
        if (seriesConfig[i].yaxis == 'Y1' && seriesConfig[i].visible) {
          return lineY1(d);
        }
        if (seriesConfig[i].yaxis == 'Y2' && seriesConfig[i].visible) {
          return lineY2(d);
        }
      });
      xaxisg.call(xAxis);
      hoverg
        .select('.hover-rect')
        .call(
          zoom.transform,
          d3.zoomIdentity.scale(plotwidth / (s[1] - s[0])).translate(-s[0], 0)
        );
    }

    function zoomed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
      var t = d3.event.transform;
      xScale.domain(t.rescaleX(contextXScale).domain());
      plotg.selectAll('.series-line').attr('d', (d, i) => {
        if (seriesConfig[i].yaxis == 'Y1' && seriesConfig[i].visible) {
          return lineY1(d);
        }
        if (seriesConfig[i].yaxis == 'Y2' && seriesConfig[i].visible) {
          return lineY2(d);
        }
      });
      xaxisg.call(xAxis);
      contextg
        .select('.brush')
        .call(brush.move, xScale.range().map(t.invertX, t));
    }

    contextg
      .selectAll('.brush')
      .data([0])
      .join('g')
      .attr('class', 'brush')
      .call(brush);

    hoverg
      .selectAll('.hover-rect')
      .data([0])
      .join('rect')
      .attr('class', 'hover-rect')
      .attr('width', plotwidth)
      .attr('height', plotheight)
      .style('opacity', 0)
      .on('mousedown', hideHover)
      .on('mouseup', showHover)
      .on('mousemove', mouseMove)
      .on('mouseout', mouseOut)
      .on('mouseover', mouseOver)
      .call(zoom);
  };

  return <D3Container refcontainer={container}></D3Container>;
};

export { MultiLine };
