import React from 'react';

import { Tabs, Tab, InputLabel, ButtonGroup, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import connect from '../store/connect';

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

    tabactive: {
      color: 'white !important',
      backgroundColor: '#3f51b5 !important',
      transition: 'all 250ms !important'
    },

    tabinactive: {
      color: '#3f51b5 !important',
      backgroundColor: 'white !important',
      transition: 'all 250ms !important'
    }
  },

  { name: 'chart-type-selector' }
);

const ChartTypeSelector = props => {
  const classes = useStyles();

  const { viewID, chartType } = props;

  // const activeViewChartType = props.views[viewID].chartType;

  const handleViewChange = el => {
    props.actions.changeSelectedSeries([], viewID);
    props.actions.changeSelectedSeriesLabel(null, viewID);
    props.actions.changeLoadedArray({}, viewID);
    props.actions.changeChartType(el, viewID);
  };

  return (
    <div className={classes.root}>
      {/* <ButtonGroup className={classes.tabs}> */}
      {['MultiLine', 'Heatmap', 'Scatter', 'Histogram', 'Statistics'].map(
        (el, i) => {
          return (
            <Button
              disableRipple={true}
              className={
                chartType == el ? classes.tabactive : classes.tabinactive
              }
              color="primary"
              value={el}
              label={el}
              key={i}
              onClick={() => handleViewChange(el)}
            >
              {el}
            </Button>
          );
        }
      )}
      {/* </ButtonGroup> */}
    </div>
  );
};

const mapStateToProps = (state, ownProps) => {
  const { viewID } = ownProps;

  return {
    chartType: state.views[viewID].chartType
  };
};

export default connect(mapStateToProps)(ChartTypeSelector);
