import React, { useState, useEffect, useRef } from 'react';

import * as d3 from 'd3';

import { makeStyles } from '@material-ui/core/styles';
import {
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@material-ui/core';

const useStyles = makeStyles(
  {
    root: {
      marginBottom: 20,
      marginTop: 20,
      marginLeft: 100,
      '& td': {
        padding: 8
      }
    },
    legendrow: {
      display: 'block',
      '&:hover': {
        cursor: 'default'
      },
      '& div': {
        display: 'inline-block'
      }
    },
    legendrect: {
      width: 20,
      height: 20,
      marginLeft: 10,
      marginRight: 10,
      transition: 'opacity 200',
      boxSizing: 'border-box',
      borderRadius: 2,
      '&:hover': {
        opacity: 0.8,
        cursor: 'pointer'
      }
    },
    legendrowdiv: { display: 'inline-block' },

    legendaxisswitch: {
      marginLeft: 10,
      marginRight: 10,
      transition: 'opacity 200ms',
      boxSizing: 'border-box',
      borderRadius: 2,
      '&:hover': {
        opacity: '1.0 !important',
        cursor: 'pointer'
      }
    },
    legendname: {}
  },

  {
    name: 'multiline-handle-container'
  }
);

const MultiLineLegend = props => {
  const classes = useStyles();
  const { seriesArray, units, colorScheme } = props;
  const [seriesState, setSeriesState] = useState([]);

  useEffect(() => {
    let stateCopy = [];
    seriesArray.forEach((d, i) => {
      stateCopy.push({
        name: props.files.length > 1 ? d[0].name_multi : d[0].name_single,
        key: d[0].key,
        color: d3[colorScheme][i],
        yaxis: 'Y1',
        visible: true,
        highlighted: false
      });
    });
    setSeriesState(stateCopy);
    props.legendCallback(stateCopy);
  }, [seriesArray, units, colorScheme]);

  const handleYAxisChange = e => {
    let arraynum = e.target.getAttribute('arraynum');
    let stateCopy = [...seriesState];
    stateCopy[arraynum].yaxis = stateCopy[arraynum].yaxis == 'Y1' ? 'Y2' : 'Y1';
    setSeriesState(stateCopy);
    props.legendCallback(stateCopy);
  };

  const handleVisibleChange = e => {
    let arraynum = e.target.getAttribute('arraynum');
    let stateCopy = [...seriesState];
    stateCopy[arraynum].visible = !stateCopy[arraynum].visible;
    setSeriesState(stateCopy);
    props.legendCallback(stateCopy);
  };

  const rectStyle = d => {
    return {
      backgroundColor: d.color,
      opacity: d.visible ? 1 : 0.5
    };
  };

  const textStyle = d => {
    return {
      opacity: d.visible ? 1 : 0.5
    };
  };

  const axisStyle = d => {
    return {
      opacity: d.visible ? 1 : 0.5
    };
  };

  return (
    <TableContainer className={classes.root}>
      {seriesState.map((d, i) => {
        return (
          <TableRow key={Math.random()} className={classes.legendrow}>
            <TableCell>
              <div
                className={classes.legendrect}
                style={rectStyle(d)}
                onClick={handleVisibleChange}
                arraynum={i}
              ></div>
            </TableCell>
            <TableCell
              arraynum={i}
              onClick={handleYAxisChange}
              style={axisStyle(d)}
              className={classes.legendaxisswitch}
            >
              {d.yaxis}
            </TableCell>
            <TableCell
              style={textStyle(d)}
              className={classes.legendname}
              arraynum={i}
            >
              {d.name}
            </TableCell>
          </TableRow>
        );
      })}
    </TableContainer>
  );
};

export { MultiLineLegend };
