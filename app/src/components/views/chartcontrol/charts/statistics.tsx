import React, { useRef } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { formatTabular } from 'src/format';
import { getSeriesKeys } from 'src/sql';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@material-ui/core';

import { sum, max, min, mean, median, deviation } from 'd3';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      height: 'calc(100vh - 300px)',
      paddingLeft: 25,
      paddingTop: 25,
      paddingRight: 25,
      boxShadow: 'none',
      overflowY: 'scroll'
    },
    table: {
      boxShadow: 'none'
    }
  })
);

const Statistics = props => {
  const container = useRef(null);
  const classes = useStyles();
  let { seriesArray, units, files, plotDims } = props;

  const seriesKeys = getSeriesKeys(units, files);

  let statsarray = [];
  seriesArray.forEach(s => {
    let darray = s.map(d => d[seriesKeys.value]);
    statsarray.push({
      name: s[0][seriesKeys.name],
      sum: sum(darray),
      max: max(darray),
      min: min(darray),
      mean: mean(darray),
      median: median(darray),
      stdev: deviation(darray)
    });
  });

  return (
    <div
      style={{
        height: plotDims.height
      }}
      className={classes.root}
      ref={container}
    >
      <TableContainer className={classes.table} component={Paper}>
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
