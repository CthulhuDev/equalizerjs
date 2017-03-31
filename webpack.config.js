const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const extractSass = new ExtractTextPlugin({
  filename: "equalizer.css",
  disable: process.env.NODE_ENV === "development"
});



module.exports = {
  context: path.resolve(__dirname, './src'),
  entry: {
    app: ['./equalizer.scss','./index.js']
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'equalizer.bundle.js',
    library: 'equalizerjs',
    libraryTarget: 'umd'

  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /\.scss$/,
        use: extractSass.extract({
          use: [
          { loader: 'css-loader' },
          { loader: 'sass-loader' }
        ],
          fallback: 'style-loader'
        })
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          plugins: ['lodash'],
          presets: ['es2015']
        }
      }
    ]
  },
  plugins: [
    extractSass
  ]
};