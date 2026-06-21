import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import { installHttpApi } from './http-api';
import App from 'src/components/App';
import { store } from 'src/store/configureStore';

installHttpApi();

document.addEventListener('DOMContentLoaded', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  );
});

export { store };
