import React, { useState, useEffect, useRef } from 'react';
import { getSeriesKeys } from 'src/sql';
import { makeStyles } from '@material-ui/core/styles';
import {
  TableCell,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  Table
} from '@material-ui/core';

const useStyles = makeStyles(
  {
    root: {
      marginBottom: 20,
      marginTop: 10,
      marginLeft: 20,
      '& td': {
        padding: 5
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
      verticalAlign: 'middle',
      width: 20,
      height: 20,
      marginLeft: 0,
      marginRight: 0,
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
      marginRight: 5,
      transition: 'opacity 200ms',
      boxSizing: 'border-box',
      cursor: 'pointer',
      transition: 'all 250ms',
      borderRadius: 2,
      '&:hover': {
        fontWeight: '500',
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderRadius: '2px',
        opacity: '1.0 !important'
      }
    },
    removebtn: {
      width: 20,
      cursor: 'pointer',
      transition: 'all 250ms',
      '&:hover': {
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderRadius: '2px',
        fontWeight: '500',
        color: 'red'
      }
    },
    legendname: {}
  },

  {
    name: 'multiline-handle-container'
  }
);

const MultilineLegend = props => {
  const classes = useStyles();
  const { seriesConfig } = props;

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
      <Table>
        <TableBody>
          {seriesConfig.map((d, i) => {
            return (
              <TableRow key={Math.random()} className={classes.legendrow}>
                <TableCell className={classes.removebtn}>
                  <div onClick={() => props.removeSeriesCallback(d.key)}>X</div>
                </TableCell>
                <TableCell
                  onClick={() => props.yAxisCallback(i)}
                  style={axisStyle(d)}
                  className={classes.legendaxisswitch}
                >
                  {d.yaxis}
                </TableCell>
                <TableCell className={classes.legendrect}>
                  <div
                    className={classes.legendrect}
                    style={rectStyle(d)}
                    onClick={() => props.visibleCallback(i)}
                  ></div>
                </TableCell>
                <TableCell style={textStyle(d)} className={classes.legendname}>
                  {d.name}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export { MultilineLegend };
