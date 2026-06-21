import React, { useState, useEffect, useRef } from 'react';
import { formatDomain, formatDate, formatInt } from 'src/format';
import { getSeriesKeys } from 'src/sql';
import { D3Container } from './d3container';
import { multilinedims } from './chartdimensions';
import { NoSelectionContainer } from './noselectioncontainer';

import {
  scaleLinear,
  select,
  selectAll,
  axisLeft,
  axisBottom,
  axisRight,
  extent,
  scaleTime,
  bisector,
  mouse,
  event,
  zoomIdentity,
  line,
  brushX,
  zoom
} from 'd3';

const MultilineCanvas = props => {
  const container = useRef(null);
  // Imperative handle onto the crosshair, set once the chart is built, so an
  // externally-linked hover can redraw the cursor without a local mouse event.
  const cursorApi = useRef(null);
  // Last hover time broadcast to the linked slice — dedupes the per-pixel
  // mousemove stream down to one dispatch per data point.
  const lastHoverSent = useRef(null);
  let {
    seriesArray,
    seriesConfig,
    units,
    files,
    zoomCallback,
    zoomDomain,
    hoverTime,
    hoverSource,
    onHoverMove,
    onHoverEnd,
    viewID
  } = props;
  const { width, height } = props.plotdims;

  const seriesKeys = getSeriesKeys(units, files);

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
    // zoomDomain is an explicit dep: the chart rebuilds (redrawing the canvas
    // lines at the new x-domain) when a brush/zoom changes it. seriesArray is
    // memoized upstream so unrelated re-renders (e.g. a linked hover) don't
    // retrigger this and wipe the live cursor.
  }, [seriesArray, seriesConfig, width, height, zoomDomain]);

  // Honor a hover coming from another linked pane: draw this pane's crosshair at
  // the shared time with no local mouse event. Skipped when this pane is the
  // source (its own mouseMove already drew it) so the echo can't fight the live
  // cursor; clears the echo when the shared hover ends.
  useEffect(() => {
    const api = cursorApi.current;
    if (!api) return;
    const isSource = hoverSource != null && hoverSource === viewID;
    if (!isSource && hoverTime != null) {
      api.drawCursorAtTime(new Date(hoverTime), false);
    } else if (!isSource) {
      api.hideCursor();
    }
  }, [hoverTime, hoverSource]);

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
        seriesArray[i].forEach(d => y1vals.push(d[seriesKeys.value]));
        let unit = seriesArray[i][0][seriesKeys.units];
        if (!y1units.includes(unit)) {
          y1units.push(seriesArray[i][0][seriesKeys.units]);
        }
      }
      if (
        c.yaxis == 'Y2' &&
        seriesArray[i] != undefined &&
        c.visible === true
      ) {
        seriesArray[i].forEach(d => y2vals.push(d[seriesKeys.value]));
        let unit = seriesArray[i][0][seriesKeys.units];
        if (!y2units.includes(unit)) {
          y2units.push(seriesArray[i][0][seriesKeys.units]);
        }
      }
    });

    yconfig.y1 = {
      min: extent(y1vals)[0],
      max: extent(y1vals)[1],
      units: y1units,
      active: yconfig.y1.active
    };

    yconfig.y2 = {
      min: extent(y2vals)[0],
      max: extent(y2vals)[1],
      units: y2units,
      active: yconfig.y2.active
    };
  };

  const createChart = () => {
    let clipid = Math.floor(Math.random() * 1e6) + '-clip';

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

      const canvascontext = canvas.node().getContext('2d');

      const svg = plotcontainer
        .selectAll('svg')
        .data([0])
        .join('svg')
        .attr('width', width)
        .attr('height', height)
        .style('position', 'absolute');

      let times = [];

      seriesArray.forEach(s => s.forEach(d => times.push(d.time)));

      let xdomain = zoomDomain.length == 0 ? extent(times) : zoomDomain;

      const xScale = scaleTime().range([0, plotwidth]);
      const contextXScale = scaleTime()
        .range([0, plotwidth])
        .domain(extent(times));

      xScale.domain(xdomain);

      const yScale1 = scaleLinear()
        .range([plotheight, 0])
        .domain([yconfig.y1.min, yconfig.y1.max * (1 + ytoppad)]);

      const yScale2 = scaleLinear()
        .range([plotheight, 0])
        .domain([yconfig.y2.min, yconfig.y2.max * (1 + ytoppad)]);

      const yAxis1Format = formatDomain([yconfig.y1.min, yconfig.y1.max]);
      const yAxis2Format = formatDomain([yconfig.y2.min, yconfig.y2.max]);

      const xAxis = axisBottom(xScale);
      const contextXAxis = axisBottom(contextXScale);
      const yAxis1 = axisLeft(yScale1).tickFormat(yAxis1Format);
      const yAxis2 = axisRight(yScale2).tickFormat(yAxis2Format);

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

      const lineY1 = line()
        .x(d => xScale(d.time))
        .y(d => yScale1(d[seriesKeys.value]));

      const lineY2 = line()
        .x(d => xScale(d.time))
        .y(d => yScale2(d[seriesKeys.value]));

      const lineY1Canvas = line()
        .x(d => xScale(d.time))
        .y(d => yScale1(d[seriesKeys.value]))
        .context(canvascontext);

      const lineY2Canvas = line()
        .x(d => xScale(d.time))
        .y(d => yScale2(d[seriesKeys.value]))
        .context(canvascontext);

      if (
        seriesConfig.length == seriesArray.length &&
        seriesConfig.length > 0
      ) {
        canvascontext.clearRect(0, 0, plotwidth, plotheight);

        seriesArray.forEach((d, i) => {
          let lineFunc;
          if (seriesConfig[i].yaxis == 'Y1' && seriesConfig[i].visible) {
            lineFunc = lineY1Canvas;
          }
          if (seriesConfig[i].yaxis == 'Y2' && seriesConfig[i].visible) {
            lineFunc = lineY2Canvas;
          }

          canvascontext.beginPath();
          lineFunc(d);
          canvascontext.lineWidth = 2;
          canvascontext.strokeStyle = seriesConfig[i].color;
          canvascontext.stroke();
        });
      }

      if (seriesArray.length == 0) {
        canvascontext.clearRect(0, 0, plotwidth, plotheight);
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
        .attr('stroke-dasharray', '4, 4')
        .attr('y1', 0)
        .attr('y2', plotheight)
        .style('opacity', 0);

      const markers = hoverg
        .selectAll('.marker-circle')
        .data(seriesArray)
        .join('circle')
        .attr('class', 'marker-circle')
        .attr('r', 3)
        .style('opacity', 0);

      const tooltip = select(container.current)
        .selectAll('.tooltip')
        .data([0])
        .join('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      function hideHover() {
        markers.style('opacity', 0);
        xline.style('opacity', 0);
        tooltip.style('opacity', 0);
      }
      function showHover() {
        markers.style('opacity', 1);
        xline.style('opacity', 0);
        tooltip.style('opacity', 0);
      }

      function mouseOver(e) {
        markers.style('opacity', 1);
        xline.style('opacity', 1);
        tooltip.style('opacity', 1);
      }

      // Reposition the crosshair + per-series markers for an explicit time.
      // Shared by local hover (withTooltip → the full tooltip) and by an
      // externally-linked hover from another pane (withTooltip false — just the
      // aligned cursor). Returns the snapped time drawn, or null when the time
      // is outside this pane's current x-domain (cursor hidden).
      function drawCursorAtTime(time, withTooltip) {
        const xdomain = xScale.domain();
        if (time < xdomain[0] || time > xdomain[1]) {
          hideHover();
          return null;
        }

        let bisectDate = bisector(function(d) {
          return d.time;
        }).left;

        let pointarray = [];
        seriesArray.forEach((d, i) => {
          if (!d || d.length === 0) {
            select(markers.nodes()[i]).style('opacity', 0);
            return;
          }
          let idx = bisectDate(d, time);

          // nearest sample to `time` — clamp at the ends so an external time
          // past this series' extent picks the edge point instead of throwing.
          let a = d[idx - 1];
          let b = d[idx];
          let point = !a
            ? b
            : !b
            ? a
            : Math.abs(time - a.time) <= Math.abs(b.time - time)
            ? a
            : b;

          let marker = select(markers.nodes()[i]);
          pointarray.push(point);
          marker
            .attr('cx', () => xScale(point.time))
            .attr('cy', () => {
              if (seriesConfig[i].yaxis == 'Y1' && seriesConfig[i].visible) {
                return yScale1(point[seriesKeys.value]);
              } else if (
                seriesConfig[i].yaxis == 'Y2' &&
                seriesConfig[i].visible
              ) {
                return yScale2(point[seriesKeys.value]);
              }
            })
            .style('fill', () => seriesConfig[i].color)
            .style('stroke', () => seriesConfig[i].color)
            .style('opacity', 1);
        });

        if (pointarray.length === 0) {
          hideHover();
          return null;
        }

        // crosshair sticks to the first series' nearest sample; when panes share
        // a time grid (same file + interval) this lands on the same instant in
        // every linked pane.
        let snapped = pointarray[0].time;
        xline
          .style('opacity', 1)
          .attr('x1', xScale(snapped))
          .attr('x2', xScale(snapped));

        // External (linked) hovers want only the aligned cursor — no tooltip.
        if (!withTooltip) {
          return snapped;
        }

        // If the hovered series don't share a time grid the markers can drift;
        // warn quietly rather than alert() in a mousemove handler (the old check
        // also used .length on a Set, so it never fired).
        let timecheck = new Set(pointarray.map(d => d.time.getTime()));
        if (timecheck.size > 1) {
          console.warn('timestep: hovered series are not time-aligned');
        }

        tooltip
          .style(
            'left',
            (event.pageX / window.innerWidth) * -500 + event.pageX + 'px'
          )
          .style('top', event.pageY + 50 + 'px')
          .style('transition', 'left 100ms, top 100ms')
          .style('z-index', 999)
          .style('opacity', 0.85).html(`
      <div>
      <div style="
      padding: 5px;
      margin-left: 5px;
      ">${formatDate(pointarray[0].time)}</div>
      ${pointarray
        .map((d, i) => {
          return `
        <div
        style="
        opacity: 1.0;
        overflow: hidden;
        white-space: nowrap';
        ">
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
          position: relative;
          top: 5px
          "
          ></div>
          <div style="display: inline-block">${d[seriesKeys.name]}: </div>
          <div style='display: inline-block'>${formatInt(d[seriesKeys.value]) +
            ' ' +
            d[seriesKeys.units]}</div>
        </div>
        `;
        })
        .join('')}</div>
      `);

        return snapped;
      }

      function mouseMove(e) {
        let xpos = xScale.invert(mouse(this)[0]);
        let snapped = drawCursorAtTime(xpos, true);
        // Broadcast the snapped time so other linked panes draw a crosshair at
        // the same instant. Dedupe: the cursor quantizes to data points, so
        // consecutive moves within one point's pixel span resolve to the same
        // time — no need to thrash the store.
        if (snapped && onHoverMove) {
          let t = snapped.getTime();
          if (t !== lastHoverSent.current) {
            lastHoverSent.current = t;
            onHoverMove(t);
          }
        }
      }

      function mouseOut(e) {
        hideHover();
        lastHoverSent.current = null;
        if (onHoverEnd) onHoverEnd();
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

      const brush = brushX()
        .extent([
          [0, 0],
          [contextwidth, contextheight]
        ])
        .on('brush end', brushed);

      const zoomFunc = zoom()
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
        if (event.sourceEvent && event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
        var s = event.selection || contextXScale.range();
        let xdomain = s.map(contextXScale.invert, contextXScale);
        xScale.domain(xdomain);
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
            zoomFunc.transform,
            zoomIdentity.scale(plotwidth / (s[1] - s[0])).translate(-s[0], 0)
          );

        zoomCallback(xdomain);
      }

      function zoomed() {
        if (event.sourceEvent && event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
        var t = event.transform;
        let xdomain = t.rescaleX(contextXScale).domain();
        xScale.domain(xdomain);
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

        zoomCallback(xdomain);
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
        .call(zoomFunc);

      cursorApi.current = { drawCursorAtTime, hideCursor: hideHover };
    }
  };

  if (seriesArray.length == 0) {
    return <NoSelectionContainer plotdims={props.plotdims} />;
  } else {
    return <D3Container refcontainer={container}></D3Container>;
  }
};

export { MultilineCanvas };
