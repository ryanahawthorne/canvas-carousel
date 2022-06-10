const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: './src/main.ts',
  watch: true,
  watchOptions: {
    ignored: '**/node_modules',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
        template: 'src/index.html',
        inject: false
    }),
    new CopyPlugin({
        patterns: [
            { from: "./assets", to: "./" },
        ],
    })
  ]
};