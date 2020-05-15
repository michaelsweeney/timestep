import React, { useState, useEffect } from 'react';

import * as d3 from 'd3';

class Heatmap extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // this.createChart();
  }
  componentDidUpdate() {
    // this.createChart();
  }
  createChart = () => {
    console.log('here');
    const { series, units } = this.props;
    const key = units == 'ip' ? 'value_ip' : 'value_si';

    const width = 500;
    const height = 500;

    const margins = {
      l: 50,
      t: 50,
      b: 50,
      r: 50
    };

    const plotwidth = width - margins.l - margins.r;
    const plotheight = width - margins.t - margins.b;

    const container = d3.select(this.container);
    const rectwidth = 15;
    const rectheight = 15;

    const svg = container
      .selectAll('svg')
      .data([0])
      .join('svg');

    svg.attr('width', width).attr('height', height);

    let rects = svg
      .selectAll('.hour_rect')
      .data(series)
      .join('rect');

    let lasthour = '';

    rects
      .attr('x', d => {
        return +d3.timeFormat('%j')(d.time) * rectwidth;
      })
      .attr('y', d => {
        let hoursplit = d3.timeFormat('%H')(d.time);
        if (lasthour == hoursplit) {
          hoursplit = hoursplit - 1;
        } else {
          lasthour = hoursplit;
        }
        return hoursplit * rectheight;
      })
      .attr('width', rectwidth)
      .attr('height', rectheight)
      .style('fill', d => {
        return d3.interpolateViridis(d[key]);
      });
  };

  render() {
    return (
      <div
        className="heatmap-container"
        ref={container => (this.container = container)}
      ></div>
    );
  }
}

//   let key = units == 'ip' ? 'value_ip' : 'value_si';

//   const {data} = props;
//   console.log(data)

// }

export { Heatmap };
