import React, { useRef, useState, useEffect } from 'react';

import { connect } from 'src/store';
import { makeStyles } from '@material-ui/core/styles';
import PaneFrame from './paneframe';

// Workspace = the tiled PaneFrame row, full width. Each pane is self-contained:
// chart-type + interval live in its own pane header, series/options/export in
// its own bottom strip. (The shared left sidebar was removed — units, the only
// global control, moved to the topbar.) Panes are separated by draggable
// gutters; each pane self-measures via PaneFrame's ResizeObserver, so a gutter
// drag just changes flex-grow and the charts redraw at the new width.
const useStyles = makeStyles(
  {
    root: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'row'
    },
    gutter: {
      flex: 'none',
      width: 9,
      alignSelf: 'stretch',
      cursor: 'col-resize',
      position: 'relative',
      background: 'var(--bg)',
      touchAction: 'none',
      // hairline drawn centered; thickens to accent on hover/drag
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: 1,
        transform: 'translateX(-50%)',
        background: 'var(--hairline-2)',
        transition: 'background .12s, width .12s'
      },
      '&:hover::before': { background: 'var(--accent)', width: 3 }
    }
  },
  { name: 'workspace' }
);

const MIN_PANE = 160; // px — neither side of a gutter can shrink past this

const MappedViews = props => {
  const classes = useStyles();
  const { viewArray } = props;
  const multiPane = viewArray.length > 1;
  const containerRef = useRef(null);

  // One flex-grow weight per pane (equal by default). Reset to equal whenever
  // the pane count changes (split / close), keeping it simple and predictable.
  const [flexes, setFlexes] = useState(() => viewArray.map(() => 1));
  useEffect(() => {
    setFlexes(prev =>
      prev.length === viewArray.length ? prev : viewArray.map(() => 1)
    );
  }, [viewArray.length]);

  // Drag a gutter between pane `i` and `i+1`. Their combined width is fixed for
  // the drag, so only these two panes change; everything else holds still.
  const startDrag = i => e => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const panes = container.querySelectorAll('[data-pane]');
    const leftEl = panes[i];
    const rightEl = panes[i + 1];
    if (!leftEl || !rightEl) return;

    const leftRect = leftEl.getBoundingClientRect();
    const rightRect = rightEl.getBoundingClientRect();
    const combined = leftRect.width + rightRect.width;
    const startLeft = leftRect.left;

    const onMove = ev => {
      let leftW = ev.clientX - startLeft;
      leftW = Math.max(MIN_PANE, Math.min(combined - MIN_PANE, leftW));
      const ratio = leftW / combined;
      setFlexes(prev => {
        const sum = prev[i] + prev[i + 1];
        const next = [...prev];
        next[i] = ratio * sum;
        next[i + 1] = sum - ratio * sum;
        return next;
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className={classes.root} ref={containerRef}>
      {viewArray.map((id, i) => (
        <React.Fragment key={id}>
          {i > 0 && (
            <div
              className={classes.gutter}
              onMouseDown={startDrag(i - 1)}
              role="separator"
              aria-orientation="vertical"
              title="Drag to resize"
            />
          )}
          <PaneFrame
            viewID={id}
            paneIndex={i}
            multiPane={multiPane}
            flexGrow={flexes[i] ?? 1}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    viewArray: state.session.viewArray
  };
};

export default connect(mapStateToProps)(MappedViews);
