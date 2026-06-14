import { combineReducers } from 'redux';

import sessionReducer from './sessionreducer';
import viewReducer from './viewreducer';
import uiReducer from './uireducer';

const rootReducer = combineReducers({
  session: sessionReducer,
  views: viewReducer,
  ui: uiReducer
});

export default rootReducer;
