import React, { useState, useEffect } from 'react';

import * as d3 from 'd3';

class Histogram extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.createChart();
  }
  componentDidUpdate() {
    this.createChart();
  }
  createChart = () => {};

  render() {
    return (
      <div
        className="histogram-container"
        ref={container => (this.container = container)}
      >
        Histogram
      </div>
    );
  }
}

export { Histogram };
