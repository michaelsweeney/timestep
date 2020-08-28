// session level actions
export function setContainerDims(dims) {
  return {
    type: 'SET_CONTAINER_DIMS',
    payload: dims
  };
}

// export function changeAvailableSeries(series) {
//   return {
//     type: 'CHANGE_AVAILABLE_SERIES',
//     payload: series
//   };
// }

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

export function changeSelectedSeries(selection, viewID) {
  return {
    type: 'CHANGE_SELECTED_SERIES',
    payload: selection,
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
