/**
 * Build config for the *serve* build of Timestep — the same renderer as the
 * web build, but instead of running SQLite in-tab via sql.js it talks to a
 * loopback HTTP server (app/serve/*) that runs native sqlite3. So this bundle
 * drops sql.js entirely and installs the http-api shim (app/src/serve). The
 * Node-only core modules are externalized as a safety net (the shim imports
 * none of them; only the server side does). Output: app/dist-serve/.
 *
 *   yarn build-serve  ->  webpack + copy serve.html to dist-serve/index.html
 *   yarn serve        ->  build-serve + boot app/serve/start.ts via tsx
 */

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const baseConfig = require('./webpack.config.base');

module.exports = merge(baseConfig, {
  devtool: process.env.DEBUG_PROD === 'true' ? 'source-map' : false,

  mode: 'production',

  target: 'web',

  entry: path.join(__dirname, '..', 'app/src/serve/index.tsx'),

  output: {
    path: path.join(__dirname, '..', 'app/dist-serve'),
    publicPath: '',
    filename: 'serve.js',
    library: { type: 'window', name: 'timestepServe' }
  },

  // The serve client bundle must never pull in the Node-only core modules; only
  // app/serve/*.ts (server side) imports these. The http-api shim imports none
  // of them, so the graph is already clean — this turns a stray import into a
  // runtime `require is not defined` rather than silently bundling native code.
  externals: {
    sqlite3: 'commonjs sqlite3',
    '@timestep/core/sqlite3': 'commonjs @timestep/core/sqlite3',
    '@timestep/core/eso-cache': 'commonjs @timestep/core/eso-cache',
    '@timestep/core/eso-sqlite': 'commonjs @timestep/core/eso-sqlite'
  },

  resolve: {
    fallback: { fs: false, path: false, crypto: false }
  },

  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: { fullySpecified: false }
      },
      {
        test: /\.global\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader, options: { publicPath: './' } },
          { loader: 'css-loader' }
        ]
      },
      {
        test: /^((?!\.global).)*\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          {
            loader: 'css-loader',
            options: {
              modules: { localIdentName: '[name]__[local]__[hash:base64:5]' }
            }
          }
        ]
      },
      {
        test: /\.global\.(scss|sass)$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader', options: { importLoaders: 1 } },
          { loader: 'sass-loader' }
        ]
      },
      {
        test: /^((?!\.global).)*\.(scss|sass)$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          {
            loader: 'css-loader',
            options: {
              modules: { localIdentName: '[name]__[local]__[hash:base64:5]' },
              importLoaders: 1
            }
          },
          { loader: 'sass-loader' }
        ]
      },
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

  optimization: {
    minimizer: [new TerserPlugin({ parallel: true }), new CssMinimizerPlugin()]
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      DEBUG_PROD: false
    }),
    new MiniCssExtractPlugin({ filename: 'style.css' })
  ]
});
