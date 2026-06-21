import { combineReducers } from 'redux';

import sessionReducer from './sessionreducer';
import viewReducer from './viewreducer';
import uiReducer from './uireducer';
import linkedReducer from './linkedreducer';

const rootReducer = combineReducers({
  session: sessionReducer,
  views: viewReducer,
  ui: uiReducer,
  linked: linkedReducer
});

export default rootReducer;
