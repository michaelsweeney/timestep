import { createStore } from 'redux';
import rootReducer from '../reducers';

const state = {};

function configureStore() {
  const store = createStore(
    rootReducer,
    state,
    window.devToolsExtension ? window.devToolsExtension() : undefined
  );

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers').default;
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}

const store = configureStore();

export { store };
