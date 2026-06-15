// Cross-pane "linked" comparison state — the thin shared slice the per-pane
// restructure deliberately left out. Panes opt in (view.linked, default true)
// and then share:
//   hoverTime   — the timestamp the cursor is over in the source pane, so every
//                 other linked time-series pane draws a crosshair at the same
//                 instant (the design-week / fault-window comparison).
//   hoverSource — viewID currently emitting hover, so the source pane keeps
//                 drawing its own cursor locally instead of echoing the shared
//                 value back to itself.
//   window      — shared [t0, t1] x-domain for linked brush/zoom; [] = full
//                 extent, mirroring the multiline zoomDomain convention.
const initialState = {
  window: [],
  hoverTime: null,
  hoverSource: null
};

export default function linkedReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_LINKED_WINDOW':
      return { ...state, window: action.payload };
    case 'SET_HOVER_TIME':
      return { ...state, hoverTime: action.payload, hoverSource: action.source };
    case 'CLEAR_HOVER_TIME':
      return { ...state, hoverTime: null, hoverSource: null };
    case 'CHANGE_FILES':
      // new dataset → any shared window/hover is meaningless
      return initialState;
    default:
      return state;
  }
}
