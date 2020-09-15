// session level actions

export function setLoadingFromFile(bool) {
  return {
    type: 'SET_LOADING_FROM_FILE',
    payload: bool
  };
}

export function setActiveView(id) {
  return {
    type: 'SET_ACTIVE_VIEW',
    payload: id
  };
}

export function removeAllViews() {
  return {
    type: 'REMOVE_ALL_VIEWS'
  };
}

export function addView(id) {
  return {
    type: 'ADD_VIEW',
    newID: id
  };
}

export function removeView(id) {
  return {
    type: 'REMOVE_VIEW',
    payload: id
  };
}

export function setContainerDims(dims) {
  return {
    type: 'SET_CONTAINER_DIMS',
    payload: dims
  };
}

export function changeFileInfo(info) {
  return {
    type: 'CHANGE_FILE_INFO',
    payload: info
  };
}

export function changeFiles(files) {
  return {
    type: 'CHANGE_FILES',
    payload: files
  };
}

export function changeUnits(units) {
  return {
    type: 'CHANGE_UNITS',
    payload: units
  };
}

// view level actions - all need to have viewID for future multiple view support

export function changeChartType(chartType, viewID) {
  return {
    type: 'CHANGE_VIEW_TYPE',
    payload: chartType,
    viewID: viewID
  };
}

export function changeTimestepType(timestepType, viewID) {
  return {
    type: 'CHANGE_TIMESTEP_TYPE',
    payload: timestepType,
    viewID: viewID
  };
}

export function changeSelectedSeries(key, viewID) {
  return {
    type: 'CHANGE_SELECTED_SERIES',
    payload: key,
    viewID: viewID
  };
}

export function changeSelectedSeriesLabel(key, viewID) {
  return {
    type: 'CHANGE_SELECTED_SERIES_LABEL',
    payload: key,
    viewID: viewID
  };
}

export function setSeriesOptions(options, viewID) {
  return {
    type: 'SET_SERIES_OPTIONS',
    payload: options,
    viewID: viewID
  };
}
export function addKeyToQueue(key, viewID) {
  return {
    type: 'ADD_KEY_TO_QUEUE',
    key: key,
    viewID: viewID
  };
}

export function removeKeyFromQueue(key, viewID) {
  return {
    type: 'REMOVE_KEY_FROM_QUEUE',
    key: key,
    viewID: viewID
  };
}

export function addToLoadedArray(key, array, viewID) {
  return {
    type: 'ADD_TO_LOADED_ARRAY',
    key: key,
    payload: array,
    viewID: viewID
  };
}

export function changeLoadedArray(array, viewID) {
  return {
    type: 'CHANGE_LOADED_ARRAY',
    payload: array,
    viewID: viewID
  };
}

export function removeFromLoadedArray(key, viewID) {
  return {
    type: 'REMOVE_FROM_LOADED_ARRAY',
    key: key,
    viewID: viewID
  };
}
