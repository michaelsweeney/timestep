import React, { useState, useEffect, useRef } from 'react';

import {
  scaleLinear,
  select,
  selectAll,
  axisLeft,
  axisBottom,
  axisRight,
  event,
  brush
} from 'd3';

import colorscale from '../colorscaleindex';
import { formatDomain, formatDate, idealSplit } from 'src/format';
import { getSeriesKeys } from 'src/sql';
import { D3Container } from './d3container';
import { scatterdims } from './chartdimensions';
import { NoSelectionContainer } from './noselectioncontainer';

const ScatterCanvas = props => {
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

  const seriesKeys = getSeriesKeys(units, files);

  let x_label_array = idealSplit(
    xseries[0] ? xseries[0][seriesKeys.name] : '-'
  );
  let y_label_array = idealSplit(
    yseries[0] ? yseries[0][seriesKeys.name] : '-'
  );
  let z_label_array = idealSplit(
    zseries[0] ? zseries[0][seriesKeys.name] : '-'
  );

  const plot_title = '';
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
    const colorScale = scaleLinear().range([0, 1]);
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

    const { labelmargins, margins } = scatterdims;

    const labeltextoffset = 20;

    const plotwidth = width - margins.l - margins.r;
    const plotheight = height - margins.t - margins.b;

    const xScale = scaleLinear().range([0, plotwidth]);
    const yScale = scaleLinear().range([plotheight, 0]);

    /* SCALES */
    if (!isZoomed) {
      xScale.domain([xminrange, xmaxrange]);
      yScale.domain([yminrange, ymaxrange]);
    } else {
      xScale.domain(zoomDomain.x);
      yScale.domain(zoomDomain.y);
    }

    const colorScale = createColorScale();
    const colorFunc = colorscale[colorfunc];

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
        .style('position', 'absolute');

      const plotg = svg
        .selectAll('.plotg')
        .data([0])
        .join('g');

      plotg
        .attr('class', 'plotg')
        .attr('transform', `translate(${margins.l}, ${margins.t})`)
        .attr('clip-path', `url(#${clipid})`)
        .on('mouseover', handleMouseover)
        .on('mouseout', handleMouseout)
        .on('mousemove', handleMousemove);

      const tooltipmarker = plotg
        .selectAll('.tooltip-circle-marker')
        .data([0])
        .join('circle')
        .attr('class', 'tooltip-circle-marker');

      const brushFunc = brush()
        .extent([
          [0, 0],
          [plotwidth, plotheight]
        ])
        .on('end', brushended);

      plotg
        .selectAll('.brush')
        .data([0])
        .join('g')
        .attr('class', 'brush')
        .call(brushFunc);

      /* SCALES */

      /* HANDLE DATA */

      // create data object with x, y, z, time

      const createDataArray = (xseries, yseries, zseries) => {
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

        return dataArr;
      };

      const dataArr = createDataArray(xseries, yseries, zseries);

      // draw context

      const drawPoints = (context, dataArr) => {
        context.clearRect(0, 0, plotwidth, plotheight);

        context.strokeStyle = 'rgba(0,0,0,0.85)';
        context.lineWidth = 0.5;

        dataArr.forEach(d => {
          let { x, y, z, time } = d;
          let color = z === '' ? '#3f8cb5' : colorFunc(colorScale(z));
          let radius = 3;
          context.fillStyle = color;
          context.beginPath();
          context.arc(xScale(x), yScale(y), radius, 0, 2 * Math.PI);
          context.fill();
          context.stroke();
        });
      };

      drawPoints(context, dataArr);
      /* AXES */
      const xAxisFormat = formatDomain([xminrange, xmaxrange]);
      const yAxisFormat = formatDomain([yminrange, ymaxrange]);
      const clrAxisFormat = formatDomain([zminrange, zmaxrange]);

      const xAxis = axisBottom(xScale).tickFormat(xAxisFormat);

      const xaxisg = svg
        .selectAll('.xaxisg')
        .data([0])
        .join('g')
        .attr('class', 'xaxisg')
        .attr('transform', `translate(${margins.l},${plotheight + margins.t})`)
        .call(xAxis);

      const yAxis = axisLeft(yScale).tickFormat(yAxisFormat);
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
      const colorlegendscale = scaleLinear()
        .range([colorlegendheight, 0])
        .domain([zminrange, zmaxrange]);

      const colorLegendAxis = axisRight()
        .scale(colorlegendscale)
        .ticks(5)
        .tickFormat(clrAxisFormat);

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

      /* TOOLTIP */
      // get units for each dimension;
      const xunits = xseries[0] != undefined ? xseries[0][unitkey] : '';
      const yunits = yseries[0] != undefined ? yseries[0][unitkey] : '';
      const zunits = zseries[0] != undefined ? zseries[0][unitkey] : '';

      let tooltipdiv = select(container.current)
        .selectAll('.tooltip')
        .data([0])
        .join('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      function handleMouseover(d) {
        tooltipdiv.style('opacity', 0.85).style('z-index', 999);
        tooltipmarker.style('opacity', 1);
      }

      function handleMouseout(d) {
        tooltipdiv.style('opacity', 0).style('z-index', -1);
        tooltipmarker.style('opacity', 0);
      }

      function distanceBetween(p1, p2) {
        let [x1, y1] = p1;
        let [x2, y2] = p2;
        let d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        return d;
      }

      function getClosestPoint(point, array) {
        let distances = [];

        array.forEach((d, i) => {
          let { x, y } = d;
          let dist = distanceBetween(point, [xScale(x), yScale(y)]);
          distances.push(dist);
        });
        let mindistance = Math.min(...distances);
        let idx = distances.indexOf(mindistance);
        return array[idx];
      }

      function handleMousemove(d) {
        tooltipdiv.style('opacity', 0.85).style('z-index', 999);

        let target = event.target;
        let bbox = target.getBoundingClientRect();

        let mouseRangeX = (event.pageX - bbox.left) / bbox.width;
        let mouseRangeY = (event.pageY - bbox.top) / bbox.height;

        let closest = getClosestPoint(
          [mouseRangeX * bbox.width, mouseRangeY * bbox.height],
          dataArr,
        );

        tooltipmarker
          .attr('r', 5)
          .attr('fill', () =>
            closest.z === '' ? '#3f8cb5' : colorFunc(colorScale(closest.z))
          )
          .attr('cx', xScale(closest.x))
          .attr('cy', yScale(closest.y))
          .style('stroke', 'rgba(0,0,0,1)')
          .style('stroke-width', '1px')
          .style('opacity', 1);

        tooltipdiv
          .style('left', event.pageX - 175 + 'px')
          .style('top', event.pageY - 125 + 'px')
          .style('transition', 'left 100ms, top 100ms')
          .html(() => {
            return `
          <div class='tooltip-time'>${formatDate(closest.time)}</div>
          <div>x: ${xAxisFormat(closest.x)} ${xunits}</div>
          <div>y: ${yAxisFormat(closest.y)} ${yunits}</div>
          <div>color: ${clrAxisFormat(closest.z)} ${zunits}</div>
        `;
          });
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

      let idleTimeout;
      let idleDelay = 350;

      function idled() {
        idleTimeout = null;
      }

      function brushended() {
        let s = event.selection;
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
          plotg.select('.brush').call(brushFunc.move, null);
        }
        zoom();
      }
      function zoom() {
        xaxisg.call(xAxis);
        yaxisg.call(yAxis);
        drawPoints(context, dataArr);
      }
    }
  };
  if (xseries.length == 0 && yseries.length == 0 && zseries.length == 0) {
    return <NoSelectionContainer plotdims={props.plotdims} />;
  } else {
    return <D3Container refcontainer={container}></D3Container>;
  }
};

export { ScatterCanvas };
