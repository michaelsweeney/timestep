import React from 'react';
import { Timestep } from './js/timestep';
import { hot } from 'react-hot-loader/root';

import {
  StylesProvider,
  createGenerateClassName
} from '@material-ui/core/styles';

const generateClassName = createGenerateClassName({
  productionPrefix: 'c',
  disableGlobal: true
});

const App = () => {
  return (
    <StylesProvider generateClassName={generateClassName}>
      <Timestep />
    </StylesProvider>
  );
};

export default hot(App);
