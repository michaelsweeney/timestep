import { createStore } from 'redux';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../reducers';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

const state = {};
const store = configureStore({
  reducer: rootReducer,
  middleware: [thunk]
});

export { store };
