// session level actions

// ui
export function toggleTheme() {
  return { type: 'TOGGLE_THEME' };
}

export function setTheme(theme) {
  return { type: 'SET_THEME', payload: theme };
}

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

export function resetViews() {
  return {
    type: 'RESET_VIEWS'
  };
}

// `seed` (optional) clones a source pane's config + loaded data into the new
// pane — used by "+ Split chart" so the new pane starts as a copy of the
// focused one rather than blank. Omitted callers (fresh load, session restore)
// get the default blank pane.
export function addView(id, seed) {
  return {
    type: 'ADD_VIEW',
    payload: id,
    seed
  };
}

export function removeView(id) {
  return {
    type: 'REMOVE_VIEW',
    payload: id
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

export function setGlobalInterval(interval) {
  return {
    type: 'SET_GLOBAL_INTERVAL',
    payload: interval
  };
}

export function setNotification(message) {
  return {
    type: 'SET_NOTIFICATION',
    payload: message
  };
}

export function clearNotification() {
  return {
    type: 'CLEAR_NOTIFICATION'
  };
}

// linked / cross-pane comparison actions. hoverTime carries its source viewID
// so the emitting pane can tell its own hover apart from an echo.
export function setHoverTime(time, source) {
  return { type: 'SET_HOVER_TIME', payload: time, source };
}

export function clearHoverTime() {
  return { type: 'CLEAR_HOVER_TIME' };
}

export function setLinkedWindow(domain) {
  return { type: 'SET_LINKED_WINDOW', payload: domain };
}

// view level actions - all need to have viewID for future multiple view support

export function changeViewLinked(linked, viewID) {
  return { type: 'CHANGE_VIEW_LINKED', payload: linked, viewID };
}

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
