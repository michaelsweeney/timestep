const initialState = {
  units: 'si',
  files: [],
  fileInfo: [],
  availableSeries: {
    arrays: {
      'HVAC Timestep': [],
      'Zone Timestep': [],
      Hourly: [],
      Daily: [],
      Monthly: [],
      'Run Period': []
    },
    mapped: {
      'HVAC Timestep': [],
      'Zone Timestep': [],
      Hourly: [],
      Daily: [],
      Monthly: [],
      'Run Period': []
    }
  }
};

export default function sessionReducer(state = initialState, action) {
  switch (action.type) {
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

    case 'CHANGE_AVAILABLE_SERIES':
      return {
        ...state,
        availableSeries: action.payload
      };

    default:
      return state;
  }
}
