import React, { useState, useEffect, useRef } from 'react';

import * as d3 from 'd3';

import { formatInt, formatDate } from '../numformat';
import { D3Container } from './d3container';
import { idealSplit } from '../textformat';

const Scatter = props => {
  const container = useRef(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomDomain, setZoomDomain] = useState({
    x: [],
    y: []
  });

  const {
    files,
    units,
    colorfunc,
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

  let plot_title = '';
  let x_label = '-';
  let y_label = '-';
  let z_label = '-';

  if (files.length > 1) {
    x_label = xseries[0] ? xseries[0].name_multi : '-';
    y_label = yseries[0] ? yseries[0].name_multi : '-';
    z_label = zseries[0] ? zseries[0].name_multi : '-';
  }

  if (files.length == 1) {
    x_label = xseries[0] ? xseries[0].name_single : '-';
    y_label = yseries[0] ? yseries[0].name_single : '-';
    z_label = zseries[0] ? zseries[0].name_single : '-';
  }

  let x_label_array = idealSplit(x_label);
  let y_label_array = idealSplit(y_label);
  let z_label_array = idealSplit(z_label);

  useEffect(() => {
    createChart();
  }, [
    units,
    colorfunc,
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
    let clipid = Math.floor(Math.random() * 1e6) + '-clip';
    let gradientid = Math.floor(Math.random() * 1e6) + '-gradient';

    /* DIMENSIONS */
    const labelmargins = {
      y: 70,
      x: 40,
      title: 30,
      legend: 50,
      legendlabel: 110
    };
    const margins = {
      l: 100,
      t: 20,
      b: 100,
      r: 200
    };

    const labeltextoffset = 20;

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
      .attr('transform', `translate(${margins.l}, ${margins.t})`)
      .attr('clip-path', `url(#${clipid})`);

    /* SCALES */

    const xScale = d3.scaleLinear().range([0, plotwidth]);

    const yScale = d3.scaleLinear().range([plotheight, 0]);
    if (!isZoomed) {
      xScale.domain([xminrange, xmaxrange]);
      yScale.domain([yminrange, ymaxrange]);
    } else {
      xScale.domain(zoomDomain.x);
      yScale.domain(zoomDomain.y);
    }

    const colorScale = createColorScale();
    const colorFunc = d3[colorfunc];

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
        handleMouseover(d);
      })
      .on('mouseout', (d, i, node) => {
        handleMouseout(d);
      });

    /* AXES */
    const xAxis = d3.axisBottom(xScale).tickFormat(formatInt);

    const xaxisg = svg
      .selectAll('.xaxisg')
      .data([0])
      .join('g')
      .attr('class', 'xaxisg')
      .attr('transform', `translate(${margins.l},${plotheight + margins.t})`)
      .call(xAxis);

    const yAxis = d3.axisLeft(yScale).tickFormat(formatInt);
    const yaxisg = svg
      .selectAll('.yaxisg')
      .data([0])
      .join('g')
      .attr('class', 'yaxisg')
      .attr('transform', `translate(${margins.l},${margins.t})`)
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
      .data(x_label_array)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'x-axis-text axis-text')
      .text(d => d)
      .attr('y', (d, i) => i * labeltextoffset);

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
      .data(y_label_array)
      .join('text')
      .attr('class', 'y-axis-text axis-text')
      .attr('text-anchor', 'middle')
      .text(d => d)
      .attr('y', (d, i) => i * labeltextoffset);

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
      .data(z_label_array)
      .join('text')
      .attr('class', 'z-axis-text axis-text')
      .attr('text-anchor', 'middle')
      .text(d => d)
      .attr('y', (d, i) => i * labeltextoffset);

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
      .text(plot_title);

    /* COLOR LEGEND */

    const defs = svg
      .selectAll('.defs')
      .data([0])
      .join('g')
      .attr('class', 'defs');

    defs
      .selectAll('.color-gradient')
      .data([0])
      .join('defs')
      .attr('class', 'color-gradient');

    const colorlegendheight = plotheight / 1.5;
    const colorlegendscale = d3
      .scaleLinear()
      .range([colorlegendheight, 0])
      .domain([zminrange, zmaxrange]);

    const colorLegendAxis = d3
      .axisRight()
      .scale(colorlegendscale)
      .ticks(5)
      .tickFormat(formatInt);

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
        .style('top', event.pageY - 150 + 'px')
        .style('transition', 'left 100ms, top 100ms')
        .html(() => {
          return `
          <div>${formatDate(d.time)}</div>
          <div>x: ${formatInt(d.x)} ${xunits}</div>
          <div>y: ${formatInt(d.y)} ${yunits}</div>
          <div>color: ${formatInt(d.z)} ${zunits}</div>
        `;
        })
        .style('z-index', 999);
    }

    function handleMouseout(d) {
      tooltipdiv.style('opacity', 0).style('z-index', -1);
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
      .brush()
      .extent([
        [0, 0],
        [plotwidth, plotheight]
      ])
      .on('end', brushended);

    let idleTimeout;
    let idleDelay = 350;

    function idled() {
      idleTimeout = null;
    }

    function brushended() {
      let s = d3.event.selection;
      if (!s) {
        if (!idleTimeout) return (idleTimeout = setTimeout(idled, idleDelay));
        xScale.domain([xminrange, xmaxrange]);
        yScale.domain([yminrange, ymaxrange]);
        setIsZoomed(false);
      } else {
        let xzoom = [s[0][0], s[1][0]].map(xScale.invert, xScale);
        let yzoom = [s[1][1], s[0][1]].map(yScale.invert, yScale);
        xScale.domain(xzoom);
        yScale.domain(yzoom);
        setIsZoomed(true);
        setZoomDomain({
          x: xzoom,
          y: yzoom
        });
        plotg.select('.brush').call(brush.move, null);
      }
      zoom();
    }
    function zoom() {
      xaxisg.call(xAxis);
      yaxisg.call(yAxis);
      plotg
        .selectAll('.circle-point')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y));
    }
    plotg
      .selectAll('.brush')
      .data([0])
      .join('g')
      .attr('class', 'brush')
      .call(brush);
  };
  return <D3Container refcontainer={container}></D3Container>;
};

export { Scatter };
