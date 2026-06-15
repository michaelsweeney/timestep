import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'src/store';

// Right-aligned topbar summary: ‹dataset› · ‹units› · ‹interval›, matching the
// mockup's monospace caption. Dataset = the focused pane's first file basename;
// interval = the focused pane's timestepType; units are global.
const useStyles = makeStyles(
  theme => ({
    root: {
      flex: 'none',
      fontFamily: '"SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      fontSize: 11,
      lineHeight: 1,
      color: theme.palette.text.secondary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: 360,
      whiteSpace: 'nowrap'
    }
  }),
  { name: 'session-summary' }
);

const basename = (p: string) =>
  (p || '').split(/[\\/]/).pop() || '';

const SessionSummary = props => {
  const classes = useStyles();
  const { files, units, interval } = props;

  if (!files || files.length === 0) return null;

  const ds =
    files.length === 1 ? basename(files[0]) : `${files.length} files`;
  const parts = [ds, (units || '').toUpperCase(), interval].filter(Boolean);

  return <span className={classes.root}>{parts.join('  ·  ')}</span>;
};

const mapStateToProps = state => {
  const activeID = state.session.activeViewID;
  const view = state.views[activeID];
  return {
    files: state.session.files,
    units: state.session.units,
    interval: view ? view.timestepType : ''
  };
};

export default connect(mapStateToProps)(SessionSummary);
