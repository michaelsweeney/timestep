import React, { useState, useEffect, useRef } from 'react';
import { getSeriesKeys } from '../formatseries';
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
      width: 20,
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
                <TableCell className={classes.legendrect}>
                  <div onClick={() => props.removeSeriesCallback(d.key)}>X</div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MultiLineLegend;
