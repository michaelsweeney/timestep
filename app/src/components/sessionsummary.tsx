import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { connect } from 'src/store';

// Right-aligned topbar summary: the loaded dataset (file basename, or "N files").
// Units now have their own topbar toggle and interval is per-pane, so the summary
// is just the dataset identifier (mono — it's an EnergyPlus file name).
const useStyles = makeStyles(
  {
    // EnergyPlus data/identifiers → mono per the bnd-viz split
    root: {
      flex: 'none',
      fontFamily: 'var(--mono)',
      fontSize: 11,
      lineHeight: 1,
      color: 'var(--ink-dim)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: 360,
      whiteSpace: 'nowrap'
    }
  },
  { name: 'session-summary' }
);

const basename = (p: string) =>
  (p || '').split(/[\\/]/).pop() || '';

const SessionSummary = props => {
  const classes = useStyles();
  const { files } = props;

  if (!files || files.length === 0) return null;

  const ds =
    files.length === 1 ? basename(files[0]) : `${files.length} files`;

  return <span className={classes.root}>{ds}</span>;
};

const mapStateToProps = state => {
  return {
    files: state.session.files
  };
};

export default connect(mapStateToProps)(SessionSummary);
