import React from 'react';

import { Tabs, Tab, InputLabel } from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';
import connect from '../connect';

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
    formLabel: {
      marginTop: '10px',
      marginBottom: '10px'
    },
    tabs: {
      // width: 50
    },
    tab: {
      '&:hover': {
        // color: 'rgba(63, 81, 181,0.75) !important'
      }
    },
    tabinactive: {
      '&:hover': {
        color: 'rgba(63, 81, 181,0.75) !important'
      }
    }
  },

  { name: 'view-selector' }
);

const ViewSelector = props => {
  const classes = useStyles();

  const tempViewID = 1;

  const activeViewType = props.views[tempViewID].viewType;

  const handleViewChange = el => {
    props.actions.changeSelectedSeries([], tempViewID);
    props.actions.changeViewType(el, tempViewID);
  };

  return (
    <div className={classes.root}>
      <div className={classes.formLabel}>
        <InputLabel>Chart Type</InputLabel>
      </div>
      <Tabs
        className={classes.tabs}
        value={activeViewType}
        indicatorColor="primary"
        textColor="primary"
        orientation="vertical"
      >
        {['MultiLine', 'Heatmap', 'Scatter', 'Histogram', 'Statistics'].map(
          (el, i) => {
            return (
              <Tab
                className={
                  activeViewType == el ? classes.tab : classes.tabinactive
                }
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

const mapStateToProps = state => {
  return {
    views: state.views
  };
};

export default connect(mapStateToProps)(ViewSelector);
