/**
 * Base webpack config used across other specific configs
 */

import path from 'path';
import webpack from 'webpack';
import { dependencies as externals } from '../app/package.json';


export default {
  externals: [...Object.keys(externals || {})],

  module: {
    rules: [
      // // support react-virtualized
      // {
      //   test: /\.css$/,
      //   use: ['css-loader', 'style-loader']
      // },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
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
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2',
    // Webpack 4's default md4 hash isn't available under OpenSSL 3 (Node 17+).
    // Bumping to webpack 5 is the real fix; sha256 is the conservative override.
    hashFunction: 'sha256'
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [path.join(__dirname, '..', 'app'), 'node_modules']
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
    }),

    new webpack.NamedModulesPlugin()
  ]
};
