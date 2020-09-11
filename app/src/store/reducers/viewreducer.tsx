const initialState = {
  1: {
    viewID: 1,
    label: 'View 1',
    timestepType: 'Hourly',
    chartType: 'Heatmap',
    seriesOptions: [],
    selectedSeries: [],
    selectedSeriesLabel: null,
    isLoading: false,
    loadingQueue: {},
    loadedObj: {}
  }
};

export default function viewReducer(state = initialState, action) {
  switch (action.type) {
    case 'ADD_VIEW': {
      return {
        ...state,
        [action.newID]: {
          viewID: action.newID,
          label: `View ${action.newID}`,
          timestepType: 'Hourly',
          chartType: 'Heatmap',
          seriesOptions: [],
          selectedSeries: [],
          selectedSeriesLabel: null,
          loadingQueue: {},
          loadedObj: {},
          isLoading: false
        }
      };
    }

    case 'REMOVE_ALL_VIEWS': {
      return {};
    }

    case 'REMOVE_VIEW': {
      let newstate = { ...state };
      delete newstate[action.payload];
      return {
        ...newstate
      };
    }

    case 'CHANGE_VIEW_TYPE':
      return {
        ...state,
        [action.viewID]: {
          ...state[action.viewID],
          chartType: action.payload
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

    case 'CHANGE_SELECTED_SERIES':
      return {
        ...state,
        [action.viewID]: {
          ...state[action.viewID],
          selectedSeries: action.payload
        }
      };
    case 'CHANGE_SELECTED_SERIES_LABEL':
      return {
        ...state,
        [action.viewID]: {
          ...state[action.viewID],
          selectedSeriesLabel: action.payload
        }
      };
    case 'SET_SERIES_OPTIONS':
      return {
        ...state,
        [action.viewID]: {
          ...state[action.viewID],
          seriesOptions: action.payload
        }
      };

    case 'ADD_KEY_TO_QUEUE': {
      /*
        catches unnecesary reloading of series if the 'key' is laready loaded. X/Y/Z is
        also excluded from this because scatters render keys as 'X' / 'Y' / 'Z' rather
        than by series key name
      */
      if (
        (action.key in state[action.viewID].loadingQueue ||
          action.key in state[action.viewID].loadedObj) &&
        action.key != 'X' &&
        action.key != 'Y' &&
        action.key != 'Z'
      ) {
        return {
          ...state
        };
      } else {
        const q = { ...state[action.viewID].loadingQueue };
        q[action.key] = action.key;
        return {
          ...state,
          [action.viewID]: {
            ...state[action.viewID],
            isLoading: Object.values(q).length > 0 ? true : false,
            loadingQueue: q
          }
        };
      }
    }
    case 'REMOVE_KEY_FROM_QUEUE': {
      const q = { ...state[action.viewID].loadingQueue };
      delete q[action.key];
      return {
        ...state,
        [action.viewID]: {
          ...state[action.viewID],
          isLoading: Object.values(q).length > 0 ? true : false,
          loadingQueue: q
        }
      };
    }
    case 'ADD_TO_LOADED_ARRAY': {
      const q = { ...state[action.viewID].loadedObj };
      q[action.key] = action.payload;
      return {
        ...state,
        [action.viewID]: {
          ...state[action.viewID],
          loadedObj: q
        }
      };
    }

    case 'CHANGE_LOADED_ARRAY': {
      return {
        ...state,
        [action.viewID]: {
          ...state[action.viewID],
          loadedObj: action.payload
        }
      };
    }
    case 'REMOVE_FROM_LOADED_ARRAY': {
      const q = { ...state[action.viewID].loadedObj };
      delete q[action.key];
      return {
        ...state,
        [action.viewID]: {
          ...state[action.viewID],
          loadedObj: q
        }
      };
    }
    default:
      return state;
  }
}
