import React, { useState, useEffect } from 'react';

import * as d3 from 'd3';

class Scatter extends React.Component {
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
        className="scatter-container"
        ref={container => (this.container = container)}
      >
        Scatter
      </div>
    );
  }
}

export { Scatter };
