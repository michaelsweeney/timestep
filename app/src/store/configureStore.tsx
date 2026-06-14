import { createStore } from 'redux';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import { STORAGE_KEY } from './reducers/uireducer';

const state = {};
const store = configureStore({
  reducer: rootReducer,
  middleware: [thunk]
});

// Persist the chosen color theme so it survives relaunches. Kept out of the
// reducer (which stays pure); only writes when the value actually changes.
let lastTheme = store.getState().ui.theme;
store.subscribe(() => {
  const theme = store.getState().ui.theme;
  if (theme !== lastTheme) {
    lastTheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* localStorage unavailable — preference simply won't persist */
    }
  }
});

export { store };
