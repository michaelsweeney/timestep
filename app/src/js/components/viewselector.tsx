import React, { useState, useEffect } from 'react';

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { DEFAULTCONFIG } from '../defaultconfig';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      marginLeft: 20,
      marginRight: 20,
      marginTop: 10,
      boxSizing: 'border-box'
    },
    '& button': {
      width: 115
    }
  },
  { name: 'view-selector' }
);

const ViewSelector = props => {
  const classes = useStyles();
  const [activeView, setActiveView] = useState(DEFAULTCONFIG.defaultView);

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
        break;
      case 'Statistics':
        setActiveView('Statistics');
        props.activeViewCallback('Statistics');
        break;
    }
  };

  const variants = {
    multiline: activeView == 'MultiLine' ? 'contained' : 'outlined',
    scatter: activeView == 'Scatter' ? 'contained' : 'outlined',
    heatmap: activeView == 'Heatmap' ? 'contained' : 'outlined',
    histogram: activeView == 'Histogram' ? 'contained' : 'outlined',
    statistics: activeView == 'Statistics' ? 'contained' : 'outlined'
  };
  return (
    <div className={classes.root}>
      <ButtonGroup disableRipple={true} color="primary" orientation="vertical">
        <Button
          value={'multiline'}
          key={'multiline'}
          variant={variants.multiline}
          onClick={handleViewChange}
        >
          MultiLine
        </Button>
        <Button
          value={'heatmap'}
          key={'heatmap'}
          variant={variants.heatmap}
          onClick={handleViewChange}
        >
          Heatmap
        </Button>
        <Button
          value={'histogram'}
          key={'histogram'}
          variant={variants.histogram}
          onClick={handleViewChange}
        >
          Histogram
        </Button>
        <Button
          value={'scatter'}
          key={'scatter'}
          variant={variants.scatter}
          onClick={handleViewChange}
        >
          Scatter
        </Button>
        <Button
          value={'statistics'}
          key={'statistics'}
          variant={variants.statistics}
          onClick={handleViewChange}
        >
          Statistics
        </Button>
      </ButtonGroup>
    </div>
  );
};

export { ViewSelector };
