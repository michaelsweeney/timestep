// Web build entry. Identical to the desktop renderer entry (app/src/index.tsx)
// except it first installs the browser `window.api` shim that the desktop app
// gets from preload.js. Everything downstream — the App tree, the Redux
// store, the @timestep/core query layer — is byte-for-byte the same code.

import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import { installWebApi } from './web-api';
import App from 'src/components/App';
import { store } from 'src/store/configureStore';

installWebApi();

document.addEventListener('DOMContentLoaded', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  );
});

export { store };
