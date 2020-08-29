const initialState = {
  units: 'si',
  files: [],
  fileInfo: [],
  activeViewID: 1,
  containerDims: {
    width: 700,
    height: 500
  }
};

export default function sessionReducer(state = initialState, action) {
  switch (action.type) {
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

    default:
      return state;
  }
}
