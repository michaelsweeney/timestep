/**
 * Base webpack config used across other specific configs
 */

const path = require('path');
const webpack = require('webpack');

module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        // Include `packages/` alongside `app/` so `@timestep/core`'s .ts
        // sources get transpiled. By default the .ts files would be read
        // from node_modules/@timestep/core (symlinked) and the
        // `exclude: /node_modules/` rule would skip them.
        include: [
          path.join(__dirname, '..', 'app'),
          path.join(__dirname, '..', 'packages')
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      }
    ]
  },

  output: {
    path: path.join(__dirname, '..', 'app'),
    library: { type: 'commonjs2' }
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [path.join(__dirname, '..', 'app'), 'node_modules']
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
    })
  ]
};
