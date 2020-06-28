import React, { useState, useEffect } from 'react';

import { Button, ButtonGroup } from '@material-ui/core';

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
    }
  },
  { name: 'view-selector' }
);

const ViewSelector = props => {
  const classes = useStyles();
  const [activeView, setActiveView] = useState(DEFAULTCONFIG.defaultView);

  const handleViewChange = e => {
    setActiveView(e);
    props.activeViewCallback(e);
  };

  // const variants = {
  //   multiline: activeView == 'MultiLine' ? 'contained' : 'outlined',
  //   scatter: activeView == 'Scatter' ? 'contained' : 'outlined',
  //   heatmap: activeView == 'Heatmap' ? 'contained' : 'outlined',
  //   histogram: activeView == 'Histogram' ? 'contained' : 'outlined',
  //   statistics: activeView == 'Statistics' ? 'contained' : 'outlined'
  // };

  return (
    <div className={classes.root}>
      <ButtonGroup disableRipple={true} color="primary" orientation="vertical">
        <Button
          value={'multiline'}
          key={'multiline'}
          variant={activeView == 'MultiLine' ? 'contained' : 'outlined'}
          onClick={() => handleViewChange('MultiLine')}
        >
          MultiLine
        </Button>
        <Button
          value={'heatmap'}
          key={'heatmap'}
          variant={activeView == 'Heatmap' ? 'contained' : 'outlined'}
          onClick={() => handleViewChange('Heatmap')}
        >
          Heatmap
        </Button>
        <Button
          value={'histogram'}
          key={'histogram'}
          variant={activeView == 'Histogram' ? 'contained' : 'outlined'}
          onClick={() => handleViewChange('Histogram')}
        >
          Histogram
        </Button>
        <Button
          value={'scatter'}
          key={'scatter'}
          variant={activeView == 'Scatter' ? 'contained' : 'outlined'}
          onClick={() => handleViewChange('Scatter')}
        >
          Scatter
        </Button>
        <Button
          value={'statistics'}
          key={'statistics'}
          variant={activeView == 'Statistics' ? 'contained' : 'outlined'}
          onClick={() => handleViewChange('Statistics')}
        >
          Statistics
        </Button>
      </ButtonGroup>
    </div>
  );
};

export { ViewSelector };
