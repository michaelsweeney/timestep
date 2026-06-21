import React, { useRef, useState, useEffect } from 'react';
import ChartTypeControl from './charttypecontrol';

// One pane in the split layout. It measures its OWN box with a ResizeObserver
// and hands the size to its chart via `paneDims` — replacing the old single
// global `containerDims`, so panes can size independently. The observer is
// rAF-coalesced and only pushes new dims when the box actually changes, so a
// splitter drag redraws each chart at most once per frame.
const PaneFrame = props => {
  const { viewID, multiPane, paneIndex, flexGrow = 1 } = props;
  const ref = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setDims(prev =>
          prev.width === cr.width && prev.height === cr.height
            ? prev
            : { width: cr.width, height: cr.height }
        );
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-pane=""
      style={{
        flexGrow,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: 0,
        minHeight: 0,
        height: '100%'
      }}
    >
      <ChartTypeControl
        viewID={viewID}
        paneDims={dims}
        multiPane={multiPane}
        paneIndex={paneIndex}
      />
    </div>
  );
};

export default PaneFrame;
