import React, { useState, useEffect } from 'react';

import { Tabs, Tab } from '@material-ui/core';

import { DEFAULTCONFIG } from '../defaultconfig';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      display: 'inline-block',
      marginLeft: 10,
      marginRight: 20,
      marginTop: 10,
      paddingRight: 5,
      position: 'relative',
      left: '-5px',
      boxSizing: 'border-box'
    },
    tabs: {
      // width: 50
    },
    tab: {
      // maxWidth: 50
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

  return (
    <div className={classes.root}>
      <Tabs
        className={classes.tabs}
        value={activeView}
        indicatorColor="primary"
        textColor="primary"
        orientation="vertical"
      >
        {['MultiLine', 'Heatmap', 'Scatter', 'Histogram', 'Statistics'].map(
          (el, i) => {
            return (
              <Tab
                className={classes.tab}
                value={el}
                label={el}
                key={i}
                disableRipple={true}
                onClick={() => handleViewChange(el)}
              />
            );
          }
        )}
      </Tabs>
    </div>
  );
};

export { ViewSelector };
