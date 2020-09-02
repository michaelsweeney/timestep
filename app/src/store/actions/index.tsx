// session level actions

export function setActiveView(id) {
  return {
    type: 'SET_CONTAINER_DIMS',
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

export function changeView(view) {
  return {
    type: 'CHANGE_VIEW',
    payload: view
  };
}

// view level actions - all need to have viewID for future multiple view support

export function changeViewType(viewType, viewID) {
  return {
    type: 'CHANGE_VIEW_TYPE',
    payload: viewType,
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
