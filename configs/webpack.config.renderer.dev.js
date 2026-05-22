/**
 * Build config for development electron renderer process
 */

const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const { spawn } = require('child_process');
const { TypedCssModulesPlugin } = require('typed-css-modules-webpack-plugin');
const baseConfig = require('./webpack.config.base');
const CheckNodeEnv = require('../internals/scripts/CheckNodeEnv');

if (process.env.NODE_ENV === 'production') {
  CheckNodeEnv('development');
}

const port = process.env.PORT || 1212;

module.exports = merge(baseConfig, {
  devtool: 'eval-cheap-module-source-map',

  mode: 'development',

  // The renderer runs with nodeIntegration: false / contextIsolation: true,
  // so it has no `require` and no Node built-ins. 'web' means dependencies
  // get bundled instead of left as runtime require() calls.
  target: 'web',

  entry: [
    ...(process.env.PLAIN_HMR ? [] : ['react-hot-loader/patch']),
    require.resolve('../app/src/index.tsx')
  ],

  output: {
    path: path.join(__dirname, '..', 'app/dist'),
    publicPath: `http://localhost:${port}/dist/`,
    filename: 'renderer.dev.js'
  },

  module: {
    rules: [
      // Don't require fully-specified extensions for ESM imports — matches
      // webpack 4 / Node CJS behavior. Many deps (MUI, @babel/runtime esm)
      // import without extensions.
      {
        test: /\.m?js$/,
        resolve: { fullySpecified: false }
      },
      {
        test: /\.global\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { sourceMap: true } }
        ]
      },
      {
        test: /^((?!\.global).)*\.css$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]'
              },
              sourceMap: true,
              importLoaders: 1
            }
          }
        ]
      },
      {
        test: /\.global\.(scss|sass)$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { sourceMap: true } },
          { loader: 'sass-loader' }
        ]
      },
      {
        test: /^((?!\.global).)*\.(scss|sass)$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]'
              },
              sourceMap: true,
              importLoaders: 1
            }
          },
          { loader: 'sass-loader' }
        ]
      },
      // Fonts and images: webpack 5 asset modules replace file-loader / url-loader.
      {
        test: /\.(woff|woff2|ttf|eot|otf)(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset/resource'
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: 10 * 1024 } }
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
        type: 'asset'
      }
    ]
  },

  plugins: [
    new TypedCssModulesPlugin({
      globPattern: 'app/**/*.{css,scss,sass}'
    }),

    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    })
  ],

  devServer: {
    port,
    compress: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    static: {
      // Serve from app/ so app.html is reachable at http://localhost:PORT/app.html.
      // Loading the document from the dev server keeps it same-origin with the
      // renderer bundle (which is already served from this server's publicPath).
      directory: path.join(__dirname, '..', 'app')
    },
    historyApiFallback: {
      verbose: true,
      disableDotRule: false
    },
    setupMiddlewares(middlewares) {
      if (process.env.START_HOT) {
        console.log('Starting Main Process...');
        spawn('npm', ['run', 'start-main-dev'], {
          shell: true,
          env: process.env,
          stdio: 'inherit'
        })
          .on('close', code => process.exit(code))
          .on('error', spawnError => console.error(spawnError));
      }
      return middlewares;
    }
  }
});
