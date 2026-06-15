import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'src/store';

// Flat chart-type list (replaces the MUI button row), matching the mockup:
// one row per type with a glyph + label, the active type highlighted in brand
// indigo. Selecting a type resets the pane's series/loaded data then switches
// type — identical wiring to before.
const TYPES: Array<[string, string]> = [
  ['Heatmap', '▦'],
  ['Multiline', '∿'],
  ['Scatter', '⁘'],
  ['Histogram', '▁▃▅'],
  ['Statistics', '∑']
];

const useStyles = makeStyles(
  theme => {
    const dark = theme.palette.type === 'dark';
    const hover = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const onBg = dark ? 'rgba(140,158,255,0.14)' : 'rgba(63,81,181,0.10)';
    return {
      list: { display: 'flex', flexDirection: 'column', gap: 4 },
      ctype: {
        appearance: 'none',
        textAlign: 'left',
        background: 'transparent',
        border: '1px solid transparent',
        color: theme.palette.text.secondary,
        borderRadius: 6,
        padding: '7px 9px',
        fontFamily: theme.typography.fontFamily,
        fontWeight: 500,
        fontSize: 13,
        lineHeight: 1.2,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'background .12s, color .12s',
        '&:hover': { background: hover, color: theme.palette.text.primary }
      },
      on: {
        background: onBg,
        color: theme.palette.primary.main,
        borderColor:
          theme.palette.type === 'dark'
            ? 'rgba(140,158,255,0.3)'
            : 'rgba(63,81,181,0.3)'
      },
      gl: {
        width: 22,
        textAlign: 'center',
        opacity: 0.9,
        fontSize: 13,
        flex: 'none'
      }
    };
  },
  { name: 'chart-type-selector' }
);

const ChartTypeSelector = props => {
  const classes = useStyles();

  const { viewID, chartType } = props;

  const handleViewChange = el => {
    props.actions.changeSelectedSeries([], viewID);
    props.actions.changeSelectedSeriesLabel(null, viewID);
    props.actions.changeLoadedArray({}, viewID);
    props.actions.changeChartType(el, viewID);
  };

  return (
    <div className={classes.list}>
      {TYPES.map(([el, glyph]) => (
        <button
          key={el}
          className={
            classes.ctype + (chartType === el ? ' ' + classes.on : '')
          }
          onClick={() => handleViewChange(el)}
        >
          <span className={classes.gl}>{glyph}</span>
          {el}
        </button>
      ))}
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
