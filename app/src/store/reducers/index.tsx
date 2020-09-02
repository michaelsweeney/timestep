import { combineReducers } from 'redux';

import sessionReducer from './sessionreducer';
import viewReducer from './viewreducer';

const rootReducer = combineReducers({
  session: sessionReducer,
  views: viewReducer
});

export default rootReducer;
