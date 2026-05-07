/**
 * Build config for electron renderer process
 */

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const baseConfig = require('./webpack.config.base');
const CheckNodeEnv = require('../internals/scripts/CheckNodeEnv');
const DeleteSourceMaps = require('../internals/scripts/DeleteSourceMaps');

CheckNodeEnv('production');
DeleteSourceMaps();

module.exports = merge(baseConfig, {
  devtool: process.env.DEBUG_PROD === 'true' ? 'source-map' : false,

  mode: 'production',

  // The renderer runs with nodeIntegration: false / contextIsolation: true,
  // so it has no `require` and no Node built-ins. 'web' means dependencies
  // get bundled instead of left as runtime require() calls.
  target: 'web',

  entry: path.join(__dirname, '..', 'app/src/index.tsx'),

  output: {
    path: path.join(__dirname, '..', 'app/dist'),
    publicPath: './dist/',
    filename: 'renderer.prod.js'
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
          { loader: MiniCssExtractPlugin.loader, options: { publicPath: './' } },
          { loader: 'css-loader', options: { sourceMap: true } }
        ]
      },
      {
        test: /^((?!\.global).)*\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]'
              },
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.global\.(scss|sass)$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader', options: { sourceMap: true, importLoaders: 1 } },
          { loader: 'sass-loader', options: { sourceMap: true } }
        ]
      },
      {
        test: /^((?!\.global).)*\.(scss|sass)$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]'
              },
              importLoaders: 1,
              sourceMap: true
            }
          },
          { loader: 'sass-loader', options: { sourceMap: true } }
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

  optimization: {
    minimizer: process.env.E2E_BUILD
      ? []
      : [new TerserPlugin({ parallel: true }), new CssMinimizerPlugin()]
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      DEBUG_PROD: false,
      E2E_BUILD: false
    }),

    new MiniCssExtractPlugin({
      filename: 'style.css'
    }),

    new BundleAnalyzerPlugin({
      analyzerMode:
        process.env.OPEN_ANALYZER === 'true' ? 'server' : 'disabled',
      openAnalyzer: process.env.OPEN_ANALYZER === 'true'
    })
  ]
});
