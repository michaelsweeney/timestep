const initialState = {
  units: 'si',
  files: [],
  fileInfo: [],
  activeViewID: 1,
  viewArray: [1],
  containerDims: {
    width: 700,
    height: 500
  },
  sessionIncrement: 1,
  isLoadingFromFile: false
};

export default function sessionReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_LOADING_FROM_FILE': {
      return {
        ...state,
        isLoadingFromFile: action.payload
      };
    }

    case 'ADD_VIEW': {
      const arrayCopy = [...state.viewArray];
      arrayCopy.push(action.payload);
      return {
        ...state,
        viewArray: arrayCopy
      };
    }
    case 'REMOVE_VIEW': {
      return {
        ...state,
        viewArray: [...state.viewArray].filter(d => d != action.payload)
      };
    }
    case 'RESET_VIEWS': {
      return {
        ...state,
        viewArray: []
      };
    }
    case 'SET_ACTIVE_VIEW':
      return {
        ...state,
        activeViewID: action.payload
      };

    case 'SET_CONTAINER_DIMS':
      return {
        ...state,
        containerDims: action.payload
      };
    case 'CHANGE_FILES':
      return {
        ...state,
        files: action.payload
      };
    case 'CHANGE_UNITS':
      return {
        ...state,
        units: action.payload
      };

    case 'CHANGE_FILE_INFO':
      return {
        ...state,
        fileInfo: action.payload
      };
    case 'SET_ACTIVE_VIEW': {
      return {
        ...state,
        activeViewID: action.payload
      };
    }

    default:
      return state;
  }
}
