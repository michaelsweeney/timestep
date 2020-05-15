import React, { useState, useEffect } from 'react';

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';

const ViewSelector = props => {
  const [activeView, setActiveView] = useState('Heatmap');

  const handleViewChange = e => {
    switch (e.target.innerHTML) {
      case 'Heatmap':
        setActiveView('Heatmap');
        props.activeViewCallback('Heatmap');
        break;
      case 'Histogram':
        setActiveView('Histogram');
        props.activeViewCallback('Histogram');
        break;
      case 'Scatter':
        setActiveView('Scatter');
        props.activeViewCallback('Scatter');
        break;
      case 'MultiLine':
        setActiveView('MultiLine');
        props.activeViewCallback('MultiLine');
    }
  };
  return (
    <div>
      <ButtonGroup disableRipple={true} color="primary">
        <Button
          value="heatmap"
          variant={activeView == 'Heatmap' ? 'contained' : 'outlined'}
          onClick={handleViewChange}
        >
          Heatmap
        </Button>
        <Button
          variant={activeView == 'Histogram' ? 'contained' : 'outlined'}
          onClick={handleViewChange}
        >
          Histogram
        </Button>
        <Button
          variant={activeView == 'Scatter' ? 'contained' : 'outlined'}
          onClick={handleViewChange}
        >
          Scatter
        </Button>
        <Button
          variant={activeView == 'MultiLine' ? 'contained' : 'outlined'}
          onClick={handleViewChange}
        >
          MultiLine
        </Button>
      </ButtonGroup>
    </div>
  );
};

export { ViewSelector };
