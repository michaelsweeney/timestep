import React, { useState, useEffect, useRef } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

import * as d3 from 'd3';

import { formatTabular } from '../numformat';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      boxShadow: 'none'
    }
  })
);

const Statistics = props => {
  const container = useRef(null);
  const classes = useStyles();
  let { seriesArray, units } = props;

  const valkey = units == 'ip' ? 'value_ip' : 'value_si';
  const unitkey = units == 'ip' ? 'units_ip' : 'units_si';

  let statsarray = [];
  seriesArray.forEach(s => {
    let darray = s.map(d => d[valkey]);
    statsarray.push({
      name: props.files.length > 1 ? s[0].name_multi : s[0].name_single,
      sum: d3.sum(darray),
      max: d3.max(darray),
      min: d3.min(darray),
      mean: d3.mean(darray),
      median: d3.median(darray),
      stdev: d3.deviation(darray)
    });
  });

  return (
    <div className="multiline-container" ref={container}>
      <TableContainer className={classes.root} component={Paper}>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Series</TableCell>
              <TableCell>Sum</TableCell>
              <TableCell>Min</TableCell>
              <TableCell>Max</TableCell>
              <TableCell>Mean</TableCell>
              <TableCell>Median</TableCell>
              <TableCell>St Dev</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statsarray.map(s => {
              return (
                <TableRow key={s.name}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{formatTabular(s.sum)}</TableCell>
                  <TableCell>{formatTabular(s.min)}</TableCell>
                  <TableCell>{formatTabular(s.max)}</TableCell>
                  <TableCell>{formatTabular(s.mean)}</TableCell>
                  <TableCell>{formatTabular(s.median)}</TableCell>
                  <TableCell>{formatTabular(s.stdev)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export { Statistics };
