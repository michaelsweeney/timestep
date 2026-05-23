import React from 'react';
import { render } from 'react-dom';
import App from './components/App';

import { store } from './store/configureStore';
import { Provider } from 'react-redux';

document.addEventListener('DOMContentLoaded', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  );
});

export { store };
