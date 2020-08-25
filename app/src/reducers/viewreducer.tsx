const initialState = {
  1: {
    viewID: 1,
    label: 'View 1',
    timestepType: 'Hourly',
    viewType: 'Heatmap'
  }
};

export default function viewReducer(state = initialState, action) {
  switch (action.type) {
    case 'CHANGE_VIEW_TYPE':
      return {
        ...state,
        [action.viewID]: {
          ...state[action.viewID],
          viewType: action.payload
        }
      };
    case 'CHANGE_TIMESTEP_TYPE':
      return {
        ...state,
        [action.viewID]: {
          ...state[action.viewID],
          timestepType: action.payload
        }
      };

    default:
      return state;
  }
}
