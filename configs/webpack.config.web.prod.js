/**
 * Build config for the standalone *web* build of Timestep — the same
 * renderer, served as a plain static site (no Electron). The entry installs
 * a browser `window.api` shim (app/src/web) and the data layer runs SQLite
 * in-tab via sql.js (WebAssembly). Output: app/dist-web/ (web.js + style.css
 * + the sql.js .wasm), paired with the committed app/web.html shell.
 *
 *   yarn build-web   ->  webpack + copy web.html to dist-web/index.html
 *   yarn start-web   ->  serve app/dist-web on localhost
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

  entry: path.join(__dirname, '..', 'app/src/web/index.tsx'),

  output: {
    path: path.join(__dirname, '..', 'app/dist-web'),
    // Relative so the bundle, wasm, and assets load next to index.html
    // regardless of where the static folder is hosted.
    publicPath: '',
    filename: 'web.js',
    // Override the base config's commonjs2 library wrapping — a browser
    // <script> has no `module`, so attach exports to a window global and let
    // the entry's side effects (render) run.
    library: { type: 'window', name: 'timestepWeb' }
  },

  // The sql.js Emscripten glue references node built-ins behind environment
  // guards that never run in the browser; tell webpack not to polyfill them.
  resolve: {
    fallback: { fs: false, path: false, crypto: false }
  },

  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: { fullySpecified: false }
      },
      // Emit the sql.js WebAssembly binary as a hashed asset and hand its URL
      // to initSqlJs via locateFile.
      {
        test: /sql-wasm(-browser)?\.wasm$/,
        type: 'asset/resource',
        generator: { filename: '[name].[contenthash][ext]' }
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
