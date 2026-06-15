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
  {
    list: { display: 'flex', flexDirection: 'column', gap: 2 },
    ctype: {
      appearance: 'none',
      textAlign: 'left',
      background: 'transparent',
      border: '1px solid transparent',
      borderLeft: '2px solid transparent',
      color: 'var(--ink-dim)',
      borderRadius: 4,
      padding: '7px 9px',
      fontFamily: 'var(--sans)',
      fontWeight: 500,
      fontSize: 13,
      lineHeight: 1.2,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      transition: 'background .12s, color .12s',
      '&:hover': { background: 'var(--panel-2)', color: 'var(--ink)' }
    },
    on: {
      background: 'var(--panel-2)',
      color: 'var(--accent)',
      borderColor: 'var(--hairline-2)',
      borderLeftColor: 'var(--accent)'
    },
    // glyphs are part of the UI chrome but read as data marks; keep them mono
    gl: {
      width: 22,
      textAlign: 'center',
      opacity: 0.9,
      fontSize: 13,
      flex: 'none',
      fontFamily: 'var(--mono)'
    }
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
