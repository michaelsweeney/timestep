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
      width: 100,
      padding: '5px !important',
      margin: '5px !important',
      textAlign: 'center',
      display: 'inline-block',
      color: 'white !important',
      backgroundColor: 'rgba(63, 81, 181, 1) !important',
      transition: 'all 250ms !important'
    },

    tabinactive: {
      width: 100,
      padding: '5px !important',
      margin: '5px !important',
      textAlign: 'center',
      display: 'inline-block',
      color: 'rgba(63, 81, 181, 1) !important',
      backgroundColor: 'white !important',
      transition: 'all 250ms !important',
      '&:hover': {
        backgroundColor: 'rgba(63, 81, 181, 0.05)  !important'
      }
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
      <InputLabel> Chart Type </InputLabel>
      {/* <ButtonGroup className={classes.tabs}> */}
      {['MultiLine', 'Heatmap', 'Scatter', 'Histogram', 'Statistics'].map(
        (el, i) => {
          return (
            <Button
              disableRipple={true}
              className={
                chartType == el ? classes.tabactive : classes.tabinactive
              }
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
